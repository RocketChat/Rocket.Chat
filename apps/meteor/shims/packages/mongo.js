// src/shims/mongo.js
import * as MongoDB from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/meteor';
const client = new MongoDB.MongoClient(MONGO_URL);
let db;

// 1. Initialize connection immediately (or handle via top-level await if Node 14+)
// In a real app, you might want to wrap this in a startup function
await client.connect();
db = client.db();

// 2. Shim the MongoInternals API
export const MongoInternals = {
  defaultRemoteCollectionDriver: () => ({
    mongo: {
      db: db,
      client: client,
      // Many legacy apps use this to access the raw driver
      find: (coll, selector, options) => db.collection(coll).find(selector, options),
      _observe: () => { console.warn('MongoInternals observe not implemented in shim'); }
    }
  }),
  // Some apps instantiate this directly for remote DBs
  RemoteCollectionDriver: class RemoteCollectionDriver {
    constructor(url) {
      this.mongo = { client: new MongoClient(url) };
    }
  }
};

// 3. Shim the Mongo Namespace (your existing Collection code)
export const Mongo = {
  Collection: class Collection {
    constructor(name) {
      this._name = name;
      this.rawCollection = () => db.collection(name);
    }

    find(selector, options) {
      return this.rawCollection().find(selector, options);
    }

    findOne(selector, options) {
      return this.rawCollection().findOne(selector, options);
    }
    
    //... add other CRUD methods
  }
};