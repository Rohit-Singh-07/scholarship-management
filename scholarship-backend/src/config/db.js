// src/config/db.js
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer = null;

module.exports.connect = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI not found");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

module.exports.connectTest = async () => {
  mongoServer = await MongoMemoryServer.create();
  const testUri = mongoServer.getUri();

  await mongoose.connect(testUri); // ⬅ FIXED: no options
  console.log("Mongo Test DB connected");
};

module.exports.disconnect = async () => {
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
};
