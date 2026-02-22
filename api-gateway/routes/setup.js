const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');
const dns = require('dns').promises;
const selfsigned = require('selfsigned');
const { Pool } = require('pg');
const { createClient } = require('redis');

const router = express.Router();

const isEnabled = process.env.SETUP_WIZARD_ENABLED === 'true';
const setupToken = process.env.SETUP_WIZARD_TOKEN || '';

const rootDir = process.env.SETUP_ROOT_DIR || path.resolve(__dirname, '..', '..');
const envPath = path.join(rootDir, '.env.production');
const sslDir = path.join(rootDir, 'ssl', 'certs');
const certbotDir = path.join(rootDir, 'certbot');
const nginxProdPath = path.join(rootDir, 'nginx', 'nginx.prod.conf');

const ensureEnabled = (req, res, next) => {
  if (!isEnabled) {
    return res.status(403).json({ error: 'Assistente desativado.' });
  }
  const token = req.headers['x-setup-token'] || req.query.token;
  if (!setupToken || token !== setupToken) {
    return res.status(401).json({ error: 'Token de setup inválido.' });
  }
  return next();
};

const writeEnvFile = (config) => {
  const lines = [
    'NODE_ENV=production',
    '',
    `FRONTEND_URL=${config.frontendUrl}`,
    `ALLOWED_ORIGINS=${config.allowedOrigins}`,
    `INTEGRATION_ALLOWLIST=${config.integrationAllowlist || ''}`,
    '',
    `SUPABASE_URL=${config.supabaseUrl}`,
    `SUPABASE_ANON_KEY=${config.supabaseAnonKey}`,
    `SUPABASE_JWT_SECRET=${config.supabaseJwtSecret}`,
    '',
    `DATABASE_URL=${config.databaseUrl}`,
    `METRICS_DB_URL=${config.metricsDbUrl}`,
    '',
    `REDIS_URL=${config.redisUrl}`,
    '',
    `TR069_SERVICE_URL=${config.tr069ServiceUrl || ''}`,
    `GRAFANA_URL=${config.grafanaUrl || ''}`,
    '',
    `RATE_LIMIT_WINDOW_MS=${config.rateLimitWindowMs || 900000}`,
    `RATE_LIMIT_MAX=${config.rateLimitMax || 200}`,
    '',
    'VITE_API_URL=/api',
    'VITE_AUTH_MODE=supabase',
    'VITE_ALLOW_DEMO_LOGIN=false',
    `VITE_SUPABASE_URL=${config.supabaseUrl}`,
    `VITE_SUPABASE_ANON_KEY=${config.supabaseAnonKey}`,
    `VITE_GRAFANA_URL=${config.grafanaUrl || ''}`,
    '',
    `ALLOW_SIMULATION=${config.allowSimulation ? 'true' : 'false'}`,
    '',
    `LETSENCRYPT_ENABLED=${config.letsencryptEnabled ? 'true' : 'false'}`,
    `LETSENCRYPT_EMAIL=${config.letsencryptEmail || ''}`,
    `LETSENCRYPT_DOMAINS=${config.letsencryptDomains || ''}`
  ];

  fs.writeFileSync(envPath, lines.join('\n'));
};

const writeTlsFiles = (cert, key, domain) => {
  let certContent = cert;
  let keyContent = key;
  if (!certContent || !keyContent) {
    const attrs = [{ name: 'commonName', value: domain || 'octoisp.local' }];
    const pems = selfsigned.generate(attrs, {
      days: 365,
      keySize: 2048,
      extensions: [
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: domain || 'octoisp.local' },
            { type: 2, value: 'localhost' }
          ]
        }
      ]
    });
    certContent = pems.cert;
    keyContent = pems.private;
  }
  fs.mkdirSync(sslDir, { recursive: true });
  fs.writeFileSync(path.join(sslDir, 'fullchain.pem'), certContent);
  fs.writeFileSync(path.join(sslDir, 'privkey.pem'), keyContent);
};

const updateServerName = (domain) => {
  if (!domain) return;
  if (!fs.existsSync(nginxProdPath)) return;
  const content = fs.readFileSync(nginxProdPath, 'utf8');
  const updated = content.replace(/server_name\s+[^;]+;/g, `server_name ${domain};`);
  fs.writeFileSync(nginxProdPath, updated);
};

const readEnvFile = () => {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  return content.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return acc;
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    acc[key] = value;
    return acc;
  }, {});
};

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const copyIfExists = (src, dest) => {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
};

const restoreIfExists = (src, dest) => {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
};

const checkDns = async (domain) => {
  const records = await dns.lookup(domain, { all: true });
  return records.map((record) => record.address);
};

const checkPort80 = async (domain) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const response = await fetch(`http://${domain}/.well-known/acme-challenge/ping`, {
    method: 'GET',
    signal: controller.signal
  }).catch(() => null);
  clearTimeout(timeout);
  return response ? response.status : null;
};

const checkDockerReady = async () => {
  return new Promise((resolve) => {
    const proc = spawn('docker', ['info'], { cwd: rootDir });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
};

router.get('/status', (req, res) => {
  return res.json({
    enabled: isEnabled,
    configured: fs.existsSync(envPath),
    envPath
  });
});

router.post('/configure', ensureEnabled, (req, res) => {
  try {
    const config = req.body || {};
    const required = [
      'frontendUrl',
      'allowedOrigins',
      'supabaseUrl',
      'supabaseAnonKey',
      'supabaseJwtSecret',
      'databaseUrl',
      'metricsDbUrl',
      'redisUrl'
    ];
    const missing = required.filter((key) => !config[key]);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obrigatórios: ${missing.join(', ')}` });
    }

    writeEnvFile(config);
    if (config.tlsCert || config.tlsKey || config.letsencryptEnabled === false) {
      writeTlsFiles(config.tlsCert, config.tlsKey, config.domain);
    }
    updateServerName(config.domain);

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao gravar configurações.' });
  }
});

router.post('/deploy', ensureEnabled, (req, res) => {
  try {
    if (!fs.existsSync(envPath)) {
      return res.status(400).json({ error: 'Arquivo .env.production não encontrado.' });
    }
    const envVars = readEnvFile();
    const letsEncryptEnabled = envVars.LETSENCRYPT_ENABLED === 'true';
    if (letsEncryptEnabled) {
      return res.status(400).json({ error: 'Use o deploy em tempo real para Let’s Encrypt.' });
    }
    const args = ['compose', '-f', 'docker-compose.prod.yml', '--env-file', '.env.production', 'up', '-d'];
    execFile('docker', args, { cwd: rootDir }, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: 'Falha ao executar deploy.', detail: stderr || err.message });
      }
      return res.json({ ok: true, output: stdout });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao iniciar deploy.' });
  }
});

router.post('/test-connection', ensureEnabled, async (req, res) => {
  try {
    const { url, method = 'GET', payload } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória.' });
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: 'URL inválida.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify(payload || {}) : undefined,
      signal: controller.signal
    });
    clearTimeout(timeout);

    return res.json({
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - start
    });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao testar conexão.' });
  }
});

router.get('/deploy-stream', ensureEnabled, (req, res) => {
  if (!fs.existsSync(envPath)) {
    res.writeHead(400, { 'Content-Type': 'text/event-stream' });
    res.write(`event: error\ndata: Arquivo .env.production não encontrado\n\n`);
    return res.end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n\n`);
  };

  const sendLog = (line) => {
    res.write(`event: log\ndata: ${line}\n\n`);
  };

  const dockerBaseArgs = ['compose', '-f', 'docker-compose.prod.yml', '--env-file', '.env.production'];

  const runCommand = (args, stepName) =>
    new Promise((resolve, reject) => {
      sendEvent('step', { name: stepName, status: 'running' });
      const proc = spawn('docker', args, { cwd: rootDir });
      proc.stdout.on('data', (data) => {
        data
          .toString()
          .replace(/\r/g, '')
          .split('\n')
          .filter(Boolean)
          .forEach((line) => sendLog(line));
      });
      proc.stderr.on('data', (data) => {
        data
          .toString()
          .replace(/\r/g, '')
          .split('\n')
          .filter(Boolean)
          .forEach((line) => sendLog(line));
      });
      proc.on('close', (code) => {
        if (code === 0) {
          sendEvent('step', { name: stepName, status: 'done' });
          resolve();
        } else {
          sendEvent('step', { name: stepName, status: 'error' });
          reject(new Error(`${stepName} falhou (code ${code})`));
        }
      });
    });

  const runSimpleStep = async (stepName, action) => {
    sendEvent('step', { name: stepName, status: 'running' });
    await action();
    sendEvent('step', { name: stepName, status: 'done' });
  };

  const smartRollback = async () => {
    try {
      sendEvent('step', { name: 'Rollback inteligente', status: 'running' });
      await runCommand([...dockerBaseArgs, 'up', '-d', '--no-deps', 'nginx'], 'Restaurar Nginx');
      await runCommand(
        [...dockerBaseArgs, 'up', '-d', '--no-deps', 'api-gateway'],
        'Restaurar API Gateway'
      );
      sendEvent('step', { name: 'Rollback inteligente', status: 'done' });
    } catch (error) {
      sendLog('Rollback inteligente falhou. Executando rollback total.');
      try {
        await runCommand([...dockerBaseArgs, 'down'], 'Rollback total');
      } catch (err) {
        sendLog('Falha ao executar rollback total.');
      }
    }
  };

  (async () => {
    const envVars = readEnvFile();
    const letsEncryptEnabled = envVars.LETSENCRYPT_ENABLED === 'true';
    const letsEncryptEmail = envVars.LETSENCRYPT_EMAIL;
    const letsEncryptDomains = (envVars.LETSENCRYPT_DOMAINS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const primaryDomain = letsEncryptDomains[0];
    const hostDir = process.env.SETUP_HOST_DIR || '';
    const backupDir = path.join(rootDir, 'setup_backups', Date.now().toString());

    try {
      await runSimpleStep('Backup de configuração', async () => {
        ensureDir(backupDir);
        copyIfExists(envPath, path.join(backupDir, '.env.production'));
        copyIfExists(nginxProdPath, path.join(backupDir, 'nginx.prod.conf'));
        copyIfExists(path.join(sslDir, 'fullchain.pem'), path.join(backupDir, 'fullchain.pem'));
        copyIfExists(path.join(sslDir, 'privkey.pem'), path.join(backupDir, 'privkey.pem'));
      });

      await runSimpleStep('Validar .env.production', async () => {
        if (!fs.existsSync(envPath)) {
          throw new Error('Arquivo .env.production não encontrado.');
        }
      });

      await runSimpleStep('Validar Docker', async () => {
        const ok = await checkDockerReady();
        if (!ok) {
          throw new Error('Docker não está disponível no host.');
        }
      });

      if (letsEncryptEnabled) {
        if (!letsEncryptEmail || !letsEncryptDomains.length) {
          throw new Error('Let’s Encrypt habilitado sem e-mail/domínios.');
        }
        if (!hostDir) {
          throw new Error('SETUP_HOST_DIR obrigatório para Let’s Encrypt.');
        }

        await runSimpleStep('Pré-check DNS e porta 80', async () => {
          for (const domain of letsEncryptDomains) {
            const addresses = await checkDns(domain);
            if (!addresses.length) {
              throw new Error(`DNS não resolve para ${domain}.`);
            }
            const status = await checkPort80(domain);
            if (status === null) {
              throw new Error(`Porta 80 indisponível em ${domain}.`);
            }
          }
        });
        ensureDir(certbotDir);
        ensureDir(path.join(certbotDir, 'conf'));
        ensureDir(path.join(certbotDir, 'www'));
        await runCommand(
          [
            'run',
            '--rm',
            '-p',
            '80:80',
            '-v',
            `${path.join(hostDir, 'certbot', 'conf')}:/etc/letsencrypt`,
            '-v',
            `${path.join(hostDir, 'certbot', 'www')}:/var/www/certbot`,
            'certbot/certbot',
            'certonly',
            '--standalone',
            '--agree-tos',
            '--no-eff-email',
            '--email',
            letsEncryptEmail,
            ...letsEncryptDomains.flatMap((domain) => ['-d', domain])
          ],
          'Emitir certificado Let’s Encrypt'
        );

        await runSimpleStep('Sincronizar TLS', async () => {
          const livePath = path.join(certbotDir, 'conf', 'live', primaryDomain);
          const certPath = path.join(livePath, 'fullchain.pem');
          const keyPath = path.join(livePath, 'privkey.pem');
          if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
            throw new Error('Certificados Let’s Encrypt não encontrados.');
          }
          ensureDir(sslDir);
          fs.copyFileSync(certPath, path.join(sslDir, 'fullchain.pem'));
          fs.copyFileSync(keyPath, path.join(sslDir, 'privkey.pem'));
        });
      } else {
        await runSimpleStep('Verificar TLS', async () => {
          const certPath = path.join(sslDir, 'fullchain.pem');
          const keyPath = path.join(sslDir, 'privkey.pem');
          if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
            throw new Error('Certificados TLS não encontrados.');
          }
        });
      }

      await runCommand([...dockerBaseArgs, 'up', '-d'], 'Subir containers');
      await runCommand([...dockerBaseArgs, 'ps'], 'Verificar status');

      sendEvent('done', '0');
      res.end();
    } catch (error) {
      sendEvent('error', error.message || 'Falha no deploy.');
      await smartRollback();
      await runSimpleStep('Restaurar backup', async () => {
        restoreIfExists(path.join(backupDir, '.env.production'), envPath);
        restoreIfExists(path.join(backupDir, 'nginx.prod.conf'), nginxProdPath);
        restoreIfExists(path.join(backupDir, 'fullchain.pem'), path.join(sslDir, 'fullchain.pem'));
        restoreIfExists(path.join(backupDir, 'privkey.pem'), path.join(sslDir, 'privkey.pem'));
      });
      sendEvent('done', '1');
      res.end();
    }
  })();
});

router.post('/validate', ensureEnabled, async (req, res) => {
  const { databaseUrl, metricsDbUrl, redisUrl, supabaseUrl } = req.body || {};
  const result = {
    database: { ok: false },
    metrics: { ok: false },
    redis: { ok: false },
    supabase: { ok: false }
  };

  try {
    if (databaseUrl) {
      const pool = new Pool({ connectionString: databaseUrl });
      await pool.query('SELECT 1');
      await pool.end();
      result.database.ok = true;
    }
  } catch (error) {
    result.database.error = 'Falha ao conectar no banco transacional.';
  }

  try {
    if (metricsDbUrl) {
      const pool = new Pool({ connectionString: metricsDbUrl });
      await pool.query('SELECT 1');
      await pool.end();
      result.metrics.ok = true;
    }
  } catch (error) {
    result.metrics.error = 'Falha ao conectar no banco de métricas.';
  }

  try {
    if (redisUrl) {
      const client = createClient({ url: redisUrl });
      await client.connect();
      await client.ping();
      await client.quit();
      result.redis.ok = true;
    }
  } catch (error) {
    result.redis.error = 'Falha ao conectar no Redis.';
  }

  try {
    if (supabaseUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(supabaseUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      result.supabase.ok = response.ok || response.status === 404;
    }
  } catch (error) {
    result.supabase.error = 'Falha ao conectar no Supabase.';
  }

  return res.json(result);
});

module.exports = router;
