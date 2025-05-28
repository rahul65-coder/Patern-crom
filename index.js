import fetch from 'node-fetch';
import cron from 'node-cron';
import admin from 'firebase-admin';
import fs from 'fs';

// JSON config read karega
const serviceAccount = JSON.parse(fs.readFileSync('./huper-b9cbc-firebase-adminsdk-fbsvc-cdc905926d.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://huper-b9cbc-default-rtdb.firebaseio.com/"
});

const db = admin.database();

cron.schedule('* * * * *', async () => {
  console.log("⏰ Fetching latest results...");

  const payload = {
    pageSize: 10,
    pageNo: 1,
    typeId: 1,
    language: 0,
    random: "4a0522c6ecd8410496260e686be2a57c",
    signature: "334B5E70A0C9B8918B0B15E517E2069C",
    timestamp: Math.floor(Date.now() / 1000)
  };

  try {
    const res = await fetch("https://api.bdg88zf.com/api/webapi/GetNoaverageEmerdList", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.code === 0 && data.data.list) {
      const lastResults = data.data.list.slice(0, 7);
      const pattern = detectPattern(lastResults);

      await db.ref('patterns').push({
        period: data.data.list[0].issueNumber,
        pattern: pattern,
        numbers: lastResults.map(item => item.number),
        timestamp: Date.now()
      });

      console.log("✅ Pattern saved:", pattern);
    } else {
      console.log("❌ No data found or API error.");
    }
  
