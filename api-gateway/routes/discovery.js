const express = require('express');
const axios = require('axios');
const { requirePermission } = require('../middleware/requirePermission');

const router = express.Router();

const isPreview = process.env.NODE_ENV === 'preview' || process.env.PREVIEW_MODE === 'true';
const acsUrl = process.env.TR069_SERVICE_URL;

const demoDevices = [
  {
    id: 'disc-01',
    serialNumber: 'MK7D2A5B1',
    productClass: 'MikroTik RouterBOARD',
    ip: '192.168.1.45'
  },
  {
    id: 'disc-02',
    serialNumber: 'HW8C9D1E2',
    productClass: 'Huawei HG658',
    ip: '192.168.1.82'
  }
];

router.post('/', requirePermission('devices.discover'), async (req, res) => {
  try {
    if (!acsUrl || isPreview) {
      return res.json({ success: true, devices: demoDevices });
    }

    const response = await axios.post(`${acsUrl}/discover`, req.body);
    return res.json(response.data);
  } catch (error) {
    console.error('Erro na descoberta:', error.message);
    return res.status(500).json({ success: false, error: 'Discovery failed' });
  }
});

router.get('/history', requirePermission('devices.discover'), (req, res) => {
  res.json({
    lastRun: new Date().toISOString(),
    found: demoDevices.length,
    devices: demoDevices
  });
});

module.exports = router;
