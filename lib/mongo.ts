import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

// Check if MONGO_URI is defined, and throw an error if it's not
if (!MONGO_URI || !DB_NAME) {
  throw new Error("MONGO_URI or DB_NAME is not defined in the environment variables. Please set it in your .env file.");
}

// Extend the global object to include the `mongoClientPromise` property
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient> = global._mongoClientPromise!;

if (!global._mongoClientPromise) {
  client = new MongoClient(MONGO_URI); // Remove the outdated options
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

const getMongoDb = async () => {
  const mongoClient = await clientPromise;
  return mongoClient.db(DB_NAME);
};

export default getMongoDb;
