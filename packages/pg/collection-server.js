// hack so Knex from simple:bookshelf doesn't try to load 'pg'
Knex.Client.prototype.initializeDriver = function () {
  this.driver = PG._npmModule;
};

// Initialize Knex with a connection to the server
PG.knex = Knex({
  client: 'pg',
  connection: PG.defaultConnectionUrl
});

// the prototype of the chained query builder from knex
const QBProto = Knex.Client.prototype.QueryBuilder.prototype;

// Apparently you need this to publish multiple cursors...
QBProto._getCollectionName = function () {
  const tableName = this._publishAs ? this._publishAs : this._single.table;
  return tableName;
};

QBProto._publishCursor = function (sub) {
  const queryStr = this.toString();
  const tableName = this._getCollectionName();
  return new PG.Query(queryStr, tableName)._publishCursor(sub);
};

const oldRaw = PG.knex.raw;
PG.knex.raw = function () {
  const ret = oldRaw.apply(PG.knex, arguments);

  ret.publishAs = (tableName) => {
    ret._publishAs = tableName;
    return ret;
  };

  ret._publishCursor = (sub) => {
    if (! ret._publishAs) {
      throw new Error("Need to set table name with .publishAs() if publishing a raw query.");
    }

    return new PG.Query(ret.toString(), ret._publishAs)._publishCursor(sub);
  };

  return ret;
}

// a way for the Knex queries to run using Fibers on the server
QBProto.run = function run() {
  const result = PG.await(this);
  const table = this._single.table;
  const method = this._method;

  // XXX weird use of global vars
  const fence = DDPServer._CurrentWriteFence.get();
  if (fence) {
    if (method !== 'select') {
      PG._livePg.appendPendingWrite(table, fence.beginWrite());
    }
  }

  return result;
};

QBProto.fetch = function fetch() {
  if (this._method === 'select') {
    return this.run();
  } else {
    throw new Error("Can only call fetch on select queries.");
  }
}

QBProto.publishAs = function publishAs(tableName) {
  this._publishAs = tableName;
};

PG.Model = function modelError() {
  throw new Error("PG.Model not implemented for the server.");
}

const Future = Npm.require('fibers/future');

function awaitPromise(promise) {
  var f = new Future();
  promise.then(
    Meteor.bindEnvironment(res => f.return(res)),
    Meteor.bindEnvironment(err => f.throw(err))
  );

  return f.wait();
}

PG.await = awaitPromise;
