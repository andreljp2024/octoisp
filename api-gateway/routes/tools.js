const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { requirePermission } = require('../middleware/requirePermission');

const toolLabels = {
  ping: 'Ping contínuo',
  mtr: 'MTR gráfico',
  traceroute: 'Traceroute',
  dns: 'DNS Lookup',
  port_scan: 'Port Scanner',
  http_check: 'HTTP/HTTPS',
  ip_scan: 'IP Scanner'
};

const clamp = (value, min, max, fallback) => {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
};

const random = (min, max) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

const buildPing = (target, parameters) => {
  const count = clamp(parameters.count, 3, 20, 5);
  const samples = Array.from({ length: count }).map((_, index) => ({
    seq: index + 1,
    latencyMs: random(6, 28),
    jitterMs: random(1, 6),
    lossPercent: random(0, 2)
  }));
  const avg = samples.reduce((acc, item) => acc + item.latencyMs, 0) / samples.length;
  const output = [
    `PING ${target}`,
    `${count} pacotes enviados, ${count} recebidos, 0% perda`,
    `latência média = ${avg.toFixed(1)}ms`
  ].join('\n');
  return {
    output,
    data: { samples, avgLatencyMs: Number(avg.toFixed(1)) }
  };
};

const buildTraceroute = (target, parameters) => {
  const hops = clamp(parameters.maxHops, 4, 10, 6);
  const hopList = Array.from({ length: hops }).map((_, index) => ({
    hop: index + 1,
    host: index === hops - 1 ? target : `10.0.${index}.1`,
    latencyMs: random(2, 20 + index * 3)
  }));
  const output = [
    `Traceroute para ${target}`,
    ...hopList.map((hop) => `${hop.hop}  ${hop.host}  ${hop.latencyMs}ms`)
  ].join('\n');
  return { output, data: { hops: hopList } };
};

const buildMtr = (target, parameters) => {
  const hops = clamp(parameters.maxHops, 4, 10, 6);
  const hopList = Array.from({ length: hops }).map((_, index) => ({
    hop: index + 1,
    host: index === hops - 1 ? target : `172.16.${index}.1`,
    lossPercent: random(0, 3),
    avgMs: random(4, 25 + index * 3),
    bestMs: random(3, 8 + index * 2),
    worstMs: random(8, 40 + index * 4)
  }));
  const output = [
    `MTR para ${target}`,
    ...hopList.map(
      (hop) =>
        `${hop.hop}  ${hop.host}  perda ${hop.lossPercent}%  avg ${hop.avgMs}ms`
    )
  ].join('\n');
  return { output, data: { hops: hopList } };
};

const buildDns = (target, parameters) => {
  const type = (parameters.dnsType || 'A').toUpperCase();
  const records = [
    { type: 'A', value: '142.250.219.110', ttl: 300 },
    { type: 'AAAA', value: '2800:3f0:4004:80c::200e', ttl: 300 },
    { type: 'CNAME', value: 'edge.octoisp.local', ttl: 60 }
  ].filter((record) => record.type === type || type === 'ALL');
  const output = [
    `Consulta DNS (${type}) para ${target}`,
    ...records.map((record) => `${record.type}: ${record.value} (TTL ${record.ttl})`)
  ].join('\n');
  return { output, data: { records } };
};

const buildPortScan = (target, parameters) => {
  const ports = (parameters.ports || '22,80,443')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
  const protocol = (parameters.protocol || 'tcp').toLowerCase();
  const results = ports.map((port) => ({
    port,
    protocol,
    status: Math.random() > 0.2 ? 'open' : 'closed',
    latencyMs: random(6, 20)
  }));
  const output = [
    `Scanner de portas (${protocol.toUpperCase()})`,
    `Host: ${target}`,
    ...results.map(
      (item) => `Porta ${item.port}: ${item.status.toUpperCase()} (${item.latencyMs}ms)`
    )
  ].join('\n');
  return { output, data: { results } };
};

const buildHttpCheck = (target) => {
  const url = target.startsWith('http') ? target : `http://${target}`;
  const statusCode = 200;
  const responseTimeMs = random(40, 180);
  const output = [
    `Teste HTTP/HTTPS`,
    `URL: ${url}`,
    `Status: ${statusCode}`,
    `Tempo de resposta: ${responseTimeMs}ms`,
    `TLS: TLSv1.3`
  ].join('\n');
  return { output, data: { statusCode, responseTimeMs, tls: 'TLSv1.3', url } };
};

const buildIpScan = (target) => {
  const base = target.includes('/') ? target.split('/')[0] : target;
  const hosts = Array.from({ length: 8 }).map((_, index) => ({
    ip: `${base.split('.').slice(0, 3).join('.')}.${100 + index}`,
    status: Math.random() > 0.3 ? 'alive' : 'down',
    latencyMs: random(2, 25)
  }));
  const output = [
    `Scanner de IP (${target})`,
    ...hosts.map((host) => `${host.ip}  ${host.status.toUpperCase()}  ${host.latencyMs}ms`)
  ].join('\n');
  return { output, data: { hosts } };
};

const buildToolResult = (tool, target, parameters) => {
  switch (tool) {
    case 'ping':
      return buildPing(target, parameters);
    case 'mtr':
      return buildMtr(target, parameters);
    case 'traceroute':
      return buildTraceroute(target, parameters);
    case 'dns':
      return buildDns(target, parameters);
    case 'port_scan':
      return buildPortScan(target, parameters);
    case 'http_check':
      return buildHttpCheck(target);
    case 'ip_scan':
      return buildIpScan(target);
    default:
      return { output: 'Ferramenta não reconhecida.', data: {} };
  }
};

router.post('/run', requirePermission('tools.access'), async (req, res) => {
  try {
    const { tool, target, parameters = {}, deviceId } = req.body || {};
    if (!tool) {
      return res.status(400).json({ error: 'Ferramenta é obrigatória.' });
    }

    let resolvedTarget = target;
    let deviceMeta = null;

    if (deviceId) {
      const deviceResult = await withUser(req.user.id, (client) =>
        client.query(
          `
            SELECT d.id,
                   d.serial_number,
                   d.wan_ip,
                   d.lan_ip,
                   d.notes,
                   d.customer_id,
                   d.pop_id,
                   c.name AS customer_name,
                   p.name AS pop_name
            FROM devices d
            LEFT JOIN customers c ON c.id = d.customer_id
            LEFT JOIN pops p ON p.id = d.pop_id
            WHERE d.id = $1
            LIMIT 1
          `,
          [deviceId]
        )
      );

      if (!deviceResult.rowCount) {
        return res.status(404).json({ error: 'Dispositivo não encontrado.' });
      }

      const row = deviceResult.rows[0];
      resolvedTarget = resolvedTarget || row.wan_ip || row.lan_ip || row.serial_number;
      deviceMeta = {
        id: row.id,
        name: row.notes || row.serial_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        popId: row.pop_id,
        popName: row.pop_name
      };
    }

    if (!resolvedTarget) {
      return res.status(400).json({ error: 'Destino é obrigatório.' });
    }

    const result = buildToolResult(tool, resolvedTarget, parameters);

    let runId = null;
    const createdAt = new Date().toISOString();
    try {
      const dbResult = await withUser(req.user.id, (client) =>
        client.query(
          `
            INSERT INTO network_tool_runs (
              provider_id, user_id, device_id, customer_id, pop_id,
              tool, target, parameters, output
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, created_at
          `,
          [
            req.tenantId,
            req.user.id,
            deviceMeta?.id || null,
            deviceMeta?.customerId || null,
            deviceMeta?.popId || null,
            tool,
            resolvedTarget,
            parameters,
            result.output
          ]
        )
      );
      if (dbResult.rowCount) {
        runId = dbResult.rows[0].id;
      }
    } catch (error) {
      // Falha de persistência não deve quebrar o fluxo do preview.
      runId = null;
    }

    return res.json({
      id: runId,
      tool,
      toolLabel: toolLabels[tool] || tool,
      target: resolvedTarget,
      parameters,
      output: result.output,
      data: result.data,
      createdAt,
      device: deviceMeta
    });
  } catch (error) {
    console.error('Error running network tool:', error);
    return res.status(500).json({ error: 'Falha ao executar ferramenta.' });
  }
});

router.get('/history', requirePermission('tools.access'), async (req, res) => {
  const limit = clamp(req.query.limit, 5, 50, 10);
  try {
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT ntr.id,
                 ntr.tool,
                 ntr.target,
                 ntr.created_at,
                 d.serial_number,
                 d.notes AS device_name,
                 c.name AS customer_name,
                 p.name AS pop_name
          FROM network_tool_runs ntr
          LEFT JOIN devices d ON d.id = ntr.device_id
          LEFT JOIN customers c ON c.id = ntr.customer_id
          LEFT JOIN pops p ON p.id = ntr.pop_id
          WHERE ntr.provider_id = $1
          ORDER BY ntr.created_at DESC
          LIMIT $2
        `,
        [req.tenantId, limit]
      )
    );

    return res.json({
      runs: result.rows.map((row) => ({
        id: row.id,
        tool: row.tool,
        toolLabel: toolLabels[row.tool] || row.tool,
        target: row.target,
        createdAt: row.created_at,
        deviceName: row.device_name || row.serial_number,
        customerName: row.customer_name,
        popName: row.pop_name
      }))
    });
  } catch (error) {
    console.error('Error fetching tools history:', error);
    return res.json({ runs: [] });
  }
});

module.exports = router;
