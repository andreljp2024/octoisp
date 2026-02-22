const { Pool } = require('pg');

const mainDbUrl =
  process.env.DATABASE_URL ||
  'postgresql://octoisp:password@supabase-db-preview:5432/octoisp_preview';
const metricsDbUrl =
  process.env.METRICS_DB_URL ||
  'postgresql://octoisp:password@timescaledb-preview:5432/metrics_preview';

const demoUserId = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000000';
const points = Number(process.env.METRICS_POINTS || 288);
const intervalMinutes = Number(process.env.METRICS_INTERVAL_MINUTES || 5);

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const buildMetricRow = (device, timestamp) => ({
  time: timestamp,
  provider_id: device.provider_id,
  device_id: device.device_id,
  cpu_percent: Number(randomBetween(15, 85).toFixed(2)),
  mem_percent: Number(randomBetween(20, 90).toFixed(2)),
  traffic_in_bps: Math.floor(randomBetween(10_000_000, 450_000_000)),
  traffic_out_bps: Math.floor(randomBetween(8_000_000, 380_000_000)),
  latency_ms: Number(randomBetween(4, 45).toFixed(2)),
  packet_loss: Number(randomBetween(0, 0.8).toFixed(2)),
  temperature_c: Number(randomBetween(32, 72).toFixed(2))
});

const seedMetrics = async () => {
  const mainPool = new Pool({ connectionString: mainDbUrl });
  const metricsPool = new Pool({ connectionString: metricsDbUrl });

  const mainClient = await mainPool.connect();
  const metricsClient = await metricsPool.connect();

  try {
    const devicesResult = await mainClient.query(
      'SELECT id AS device_id, provider_id FROM devices ORDER BY created_at'
    );

    if (!devicesResult.rowCount) {
      console.log('Nenhum dispositivo encontrado para seed.');
      return;
    }

    await metricsClient.query('BEGIN');
    await metricsClient.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [demoUserId]);
    await metricsClient.query(
      "SELECT set_config('request.jwt.claims', $1, true)",
      [JSON.stringify({ sub: demoUserId })]
    );

    const providerIds = [...new Set(devicesResult.rows.map((row) => row.provider_id))];
    for (const providerId of providerIds) {
      await metricsClient.query(
        `
          INSERT INTO user_provider_access (user_id, provider_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, provider_id) DO NOTHING
        `,
        [demoUserId, providerId]
      );
    }

    const rows = [];
    const startTime = new Date(Date.now() - points * intervalMinutes * 60 * 1000);

    devicesResult.rows.forEach((device) => {
      for (let i = 0; i < points; i += 1) {
        const timestamp = new Date(startTime.getTime() + i * intervalMinutes * 60 * 1000);
        rows.push(buildMetricRow(device, timestamp));
      }
    });

    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = [];
      const placeholders = batch.map((row, index) => {
        const offset = index * 10;
        values.push(
          row.time,
          row.provider_id,
          row.device_id,
          row.cpu_percent,
          row.mem_percent,
          row.traffic_in_bps,
          row.traffic_out_bps,
          row.latency_ms,
          row.packet_loss,
          row.temperature_c
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`;
      });

      await metricsClient.query(
        `
          INSERT INTO device_metrics (
            time, provider_id, device_id, cpu_percent, mem_percent,
            traffic_in_bps, traffic_out_bps, latency_ms, packet_loss, temperature_c
          ) VALUES ${placeholders.join(', ')}
        `,
        values
      );
    }

    await metricsClient.query('COMMIT');
    console.log(`Seed concluído: ${rows.length} pontos inseridos.`);
  } catch (error) {
    await metricsClient.query('ROLLBACK');
    console.error('Erro ao seedar métricas:', error);
  } finally {
    metricsClient.release();
    mainClient.release();
    await mainPool.end();
    await metricsPool.end();
  }
};

seedMetrics();
