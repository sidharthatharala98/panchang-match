'use strict';

const swe = require('swisseph');

const TITHIS = [
  'Shukla Pratipada',
  'Shukla Dwitiya',
  'Shukla Tritiya',
  'Shukla Chaturthi',
  'Shukla Panchami',
  'Shukla Shashthi',
  'Shukla Saptami',
  'Shukla Ashtami',
  'Shukla Navami',
  'Shukla Dashami',
  'Shukla Ekadashi',
  'Shukla Dwadashi',
  'Shukla Trayodashi',
  'Shukla Chaturdashi',
  'Purnima',

  'Krishna Pratipada',
  'Krishna Dwitiya',
  'Krishna Tritiya',
  'Krishna Chaturthi',
  'Krishna Panchami',
  'Krishna Shashthi',
  'Krishna Saptami',
  'Krishna Ashtami',
  'Krishna Navami',
  'Krishna Dashami',
  'Krishna Ekadashi',
  'Krishna Dwadashi',
  'Krishna Trayodashi',
  'Krishna Chaturdashi',
  'Amavasya'
];

const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati'
];

const YOGAS = [
  'Vishkambha',
  'Priti',
  'Ayushman',
  'Saubhagya',
  'Shobhana',
  'Atiganda',
  'Sukarma',
  'Dhriti',
  'Shula',
  'Ganda',
  'Vriddhi',
  'Dhruva',
  'Vyaghata',
  'Harshana',
  'Vajra',
  'Siddhi',
  'Vyatipata',
  'Variyana',
  'Parigha',
  'Shiva',
  'Siddha',
  'Sadhya',
  'Shubha',
  'Shukla',
  'Brahma',
  'Indra',
  'Vaidhriti'
];

const KARANAS = [
  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Garaja',
  'Vanija',
  'Vishti',

  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Garaja',
  'Vanija',
  'Vishti',

  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Garaja',
  'Vanija',
  'Vishti',

  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Garaja',
  'Vanija',
  'Vishti',

  'Shakuni',
  'Chatushpada',
  'Naga',
  'Kimstughna'
];

const VARAS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

function normalize360(value) {
  value %= 360;

  if (value < 0) {
    value += 360;
  }

  return value;
}

function getJulianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function getLongitude(jd, body) {
  const flags =
    swe.SEFLG_SWIEPH |
    swe.SEFLG_SIDEREAL |
    swe.SEFLG_SPEED;

  const result = swe.swe_calc_ut(jd, body, flags);

  if (!result || typeof result.longitude !== 'number') {
    throw new Error(
      `Unable to calculate longitude for body ${body}`
    );
  }

  return normalize360(result.longitude);
}

function getKaranaIndex(halfTithi) {
  /*
   * There are 60 half-tithis in a lunar month.

   * Moving karanas:
   * Bava → Balava → Kaulava → Taitila →
   * Garaja → Vanija → Vishti

   * Fixed karanas:
   * Shakuni
   * Chatushpada
   * Naga
   * Kimstughna
   */

  if (halfTithi === 0) {
    return 31; // Kimstughna
  }

  if (halfTithi === 57) {
    return 28; // Shakuni
  }

  if (halfTithi === 58) {
    return 29; // Chatushpada
  }

  if (halfTithi === 59) {
    return 30; // Naga
  }

  return (halfTithi - 1) % 7;
}

function calculatePanchang(input) {
  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time: ${input}`);
  }

  /*
   * Use Lahiri ayanamsa.
   */
  swe.swe_set_sid_mode(
    swe.SE_SIDM_LAHIRI,
    0,
    0
  );

  const jd = getJulianDay(date);

  /*
   * Sidereal Sun and Moon longitudes.
   */
  const sunLongitude = getLongitude(
    jd,
    swe.SE_SUN
  );

  const moonLongitude = getLongitude(
    jd,
    swe.SE_MOON
  );

  /*
   * Angular distance between Moon and Sun.
   *
   * Every 12 degrees = one Tithi.
   */
  const elongation = normalize360(
    moonLongitude - sunLongitude
  );

  const tithiIndex = Math.floor(
    elongation / 12
  );

  /*
   * Every 13°20' = one Nakshatra.
   */
  const nakshatraIndex = Math.floor(
    moonLongitude / (360 / 27)
  );

  /*
   * Yoga is based on the sum of
   * sidereal Sun + Moon longitude.
   *
   * Every 13°20' = one Yoga.
   */
  const yogaLongitude = normalize360(
    sunLongitude + moonLongitude
  );

  const yogaIndex = Math.floor(
    yogaLongitude / (360 / 27)
  );

  /*
   * Every 6 degrees of elongation = one Karana.
   */
  const halfTithi = Math.floor(
    elongation / 6
  );

  const karanaIndex = getKaranaIndex(
    halfTithi
  );

  /*
   * Vara is the weekday.
   *
   * getUTCDay() is correct because the
   * input is an exact instant.
   */
  const varaIndex = date.getUTCDay();

  return {
    input: {
      iso: date.toISOString(),

      indiaDate: date.toLocaleDateString(
        'en-IN',
        {
          timeZone: 'Asia/Kolkata'
        }
      ),

      indiaTime: date.toLocaleTimeString(
        'en-IN',
        {
          timeZone: 'Asia/Kolkata',
          hour12: false
        }
      )
    },

    julianDay: Number(jd.toFixed(8)),

    ayanamsa: 'Lahiri',

    vara: {
      index: varaIndex + 1,
      name: VARAS[varaIndex]
    },

    sun: {
      longitude: Number(
        sunLongitude.toFixed(6)
      )
    },

    moon: {
      longitude: Number(
        moonLongitude.toFixed(6)
      )
    },

    tithi: {
      index: tithiIndex + 1,
      name: TITHIS[tithiIndex],

      elongation: Number(
        elongation.toFixed(6)
      )
    },

    nakshatra: {
      index: nakshatraIndex + 1,
      name: NAKSHATRAS[nakshatraIndex]
    },

    yoga: {
      index: yogaIndex + 1,
      name: YOGAS[yogaIndex]
    },

    karana: {
      index: karanaIndex + 1,
      name: KARANAS[karanaIndex]
    }
  };
}

module.exports = {
  calculatePanchang
};
