const db = require('../db/connection');

async function getProfile(req, res, next) {
  try {
    const citizenId = req.user.citizen_id || req.params.id;
    if (!citizenId) {
      return res.status(400).json({ error: 'Citizen ID not found in token or URL.' });
    }

    const citizens = await db.query(
      `SELECT c.citizen_id, c.name, c.date_of_birth, c.gender, c.mobile, c.email, c.created_at,
              a.address_id, a.house_number, a.street, a.village, a.taluk, a.district, a.state, a.pin_code
       FROM Citizen c
       LEFT JOIN Address a ON c.address_id = a.address_id
       WHERE c.citizen_id = ?`,
      [citizenId]
    );

    if (citizens.length === 0) {
      return res.status(404).json({ error: 'Citizen record not found.' });
    }

    const voterRecords = await db.query(
      `SELECT vr.voter_id, vr.epic_reference, vr.record_status, vr.last_checked_at,
              co.name AS constituency_name, ps.station_name AS polling_station_name
       FROM Voter_Record vr
       LEFT JOIN Constituency co ON vr.constituency_id = co.constituency_id
       LEFT JOIN Polling_Station ps ON vr.polling_station_id = ps.polling_station_id
       WHERE vr.citizen_id = ?`,
      [citizenId]
    );

    const profile = citizens[0];
    profile.voter_records = voterRecords;

    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    const { name, date_of_birth, gender, mobile, address } = req.body;

    if (!citizenId) {
      return res.status(400).json({ error: 'Citizen ID missing.' });
    }

    await db.query(
      'UPDATE Citizen SET name = COALESCE(?, name), date_of_birth = COALESCE(?, date_of_birth), gender = COALESCE(?, gender), mobile = COALESCE(?, mobile) WHERE citizen_id = ?',
      [name, date_of_birth, gender, mobile, citizenId]
    );

    if (address) {
      const citizenRows = await db.query('SELECT address_id FROM Citizen WHERE citizen_id = ?', [citizenId]);
      const currentAddressId = citizenRows[0]?.address_id;

      if (currentAddressId) {
        await db.query(
          'UPDATE Address SET house_number = ?, street = ?, village = ?, taluk = ?, district = ?, state = ?, pin_code = ? WHERE address_id = ?',
          [address.house_number, address.street, address.village, address.taluk, address.district, address.state || 'Karnataka', address.pin_code, currentAddressId]
        );
      } else {
        const addrRes = await db.query(
          'INSERT INTO Address (house_number, street, village, taluk, district, state, pin_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [address.house_number, address.street, address.village, address.taluk, address.district, address.state || 'Karnataka', address.pin_code]
        );
        const newAddressId = addrRes.insertId || Date.now();
        await db.query('UPDATE Citizen SET address_id = ? WHERE citizen_id = ?', [newAddressId, citizenId]);
      }
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile
};
