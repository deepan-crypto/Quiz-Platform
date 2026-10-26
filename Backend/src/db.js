const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'EduAI';

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
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log(`Successfully connected to MongoDB database: ${dbName}`);
        return { client, db };
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
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
  dbName
};
