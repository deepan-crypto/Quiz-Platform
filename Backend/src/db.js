const { MongoClient } = require('mongodb');

/**
 * Automatically percent-encodes special characters (such as @ in password)
 * so MongoDB URI parsing doesn't break if raw passwords contain @ or other reserved symbols.
 */
function formatMongoUri(rawUri) {
  if (!rawUri) return rawUri;
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@]+)$/);
  if (match) {
    const [, protocol, username, password, hostAndParams] = match;
    try {
      const cleanUsername = encodeURIComponent(decodeURIComponent(username));
      const cleanPassword = encodeURIComponent(decodeURIComponent(password));
      return `${protocol}${cleanUsername}:${cleanPassword}@${hostAndParams}`;
    } catch {
      return rawUri;
    }
  }
  return rawUri;
}

const rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const uri = formatMongoUri(rawUri);
const dbName = process.env.MONGODB_DB_NAME || 'EduAI';

// Warn if deployed without a cloud MongoDB instance
if (process.env.NODE_ENV === 'production' && (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost') || process.env.MONGODB_URI.includes('127.0.0.1'))) {
  console.warn('⚠️ ==============================================================');
  console.warn('⚠️ WARNING: Deployed in production but MONGODB_URI is not set to a remote MongoDB (like MongoDB Atlas)!');
  console.warn('⚠️ Cloud containers (such as Render) do not have a local MongoDB daemon.');
  console.warn('⚠️ Please add MONGODB_URI in your Render Dashboard > Environment.');
  console.warn('⚠️ ==============================================================');
}

let client = null;
let db = null;
let connectionPromise = null;

/**
 * Connect to MongoDB and return singleton client and db instances.
 */
async function connectToDatabase() {
  if (db && client) {
    return { client, db };
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      try {
        const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        console.log(`Connecting to MongoDB at: ${maskedUri}`);
        client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 5000, // Timeout faster (5s) instead of hanging
        });
        await client.connect();
        db = client.db(dbName);
        console.log(`✅ Successfully connected to MongoDB database: ${dbName}`);
        return { client, db };
      } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        connectionPromise = null; // Reset to allow retry on subsequent requests
        throw error;
      }
    })();
  }

  return connectionPromise;
}

/**
 * Get MongoDB database instance.
 */
async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Get MongoDB client instance.
 */
async function getClient() {
  const { client } = await connectToDatabase();
  return client;
}

module.exports = {
  connectToDatabase,
  getDb,
  getClient,
  dbName,
  uri,
  formatMongoUri
};
