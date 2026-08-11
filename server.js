const express = require('express');
const path = require('path');
const cors = require('cors');

const { calculatePanchang } = require('./services/panchang');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/ping', (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString()
  });
});

app.get('/api/panchang', (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date) {
      return res.status(400).json({
        ok: false,
        error: 'Missing date parameter',
        example: '/api/panchang?date=2007-08-09&time=14:30'
      });
    }

    const inputTime = time || '00:00';

    const isoDateTime =
      `${date}T${inputTime}:00+05:30`;

    const panchang = calculatePanchang(isoDateTime);

    res.json({
      ok: true,
      date,
      time: inputTime,
      timezone: 'Asia/Kolkata',
      location: req.query.location || null,
      panchang
    });

  } catch (error) {
    console.error('Panchang calculation error:', error);

    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Panchang Match server listening on port ${PORT}`
  );
});
