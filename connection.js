const { MongoClient, ServerApiVersion } = require('mongodb');

const mongoUrl = "mongodb+srv://<username>:<encoded_password>@cluster_name.qp19m.mongodb.net/?retryWrites=true&w=majority&appName=cluster_name"; //mongodburl
const dbName = "eventsDB"; // it is the database name


const client = new MongoClient(mongoUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

//asynchronous function to connect to the database
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    db = client.db(dbName); // connect to the database
    console.log(`Using database: ${dbName}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // exit the process if connection fails or any error occurs
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase() first.");
  }
  return db;
}


//export the connection
module.exports = { connectToDatabase, getDb };
