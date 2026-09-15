// 1. Import official Firebase Admin and Core components using CommonJS syntax
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// 2. Safely initialize the Firebase Admin SDK connection
// It uses Environment Variables configured in Vercel to secure your database credentials
const firebaseConfig = {
  projectId: "playfestbw-2301a",
  databaseURL: "https://firebaseio.com"
};

// Prevent duplicate initialization crashes during live hot-reloads
if (!getApps().length) {
  initializeApp({
    ...firebaseConfig,
    // Add credential configuration here if using a service account JSON string in Vercel env
    // credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

const db = getDatabase();

/**
 * CommonJS Controller / API Endpoint Module
 * Fetches all real-time registrants from the database.
 */
async function getRegistrationsHandler(req, res) {
  try {
    const registrationsRef = db.ref('registrations');
    
    // Perform a clean server-side read snapshot
    const snapshot = await registrationsRef.once('value');
    const data = snapshot.val();
    
    if (!data) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Format the unique Firebase object map cleanly into a structured array
    const formattedList = Object.keys(data).map(key => ({
      id: key,
      name: data[key].name || "Anonymous",
      email: data[key].email || "N/A",
      timestamp: data[key].timestamp || null
    })).sort((a, b) => b.timestamp - a.timestamp); // Show latest registrants first

    return res.status(200).json({
      success: true,
      count: formattedList.length,
      data: formattedList
    });

  } catch (error) {
    console.error("Administrative Dashboard API Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server compilation error or database connection timeout." 
    });
  }
}

// 3. Export using CommonJS module pattern
module.exports = {
  getRegistrationsHandler,
  dbInstance: db
};
