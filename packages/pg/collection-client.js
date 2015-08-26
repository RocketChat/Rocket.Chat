// Initialize Knex on the client with no connection
PG.knex = Knex(null);

// the prototype of the chained query builder from knex
const QBProto = Knex.QueryBuilder.prototype;

PG.knex.raw = function raw() {
  throw new Error("Can't use raw SQL queries on the client.");
}

// Run the query against minimongo and return exactly what minimongo would have
// returned, don't call fetch on it.
QBProto._runNotFetch = function _runNotFetch() {
  const {
    collection,
    method,
    selector,
    modifier,
    projection,
    sort,
    limit,
    skip
  } = this.toMongoQuery();

  const options = {
    sort, limit, skip,
    fields: projection
  };

  if (! collection) {
    throw new Error('Specify the table to query. E.g.: PG.knex("table")...');
  }

  // run this query against local minimongo
  const minimongo = Mongo.Collection.get(collection);
  const args = [];

  if (! minimongo) {
    throw new Error('Specified table "' + collection + '" is not registered on the Client');
  }

  if (method === 'find') {
    args.push(selector, options);
  }
  if (method === 'insert') {
    args.push(modifier);
  }
  if (method === 'update') {
    args.push(selector, modifier, {multi: true});
  }
  if (method === 'remove') {
    args.push(selector);
  }

  // XXX will not work for things like "insert V into T returning *"
  const ret = minimongo[method](...args);

  return ret;
};

// A way for the Knex queries to run synchronously on the client without
// promises
QBProto.run = function () {
  const ret = this._runNotFetch();

  // Call fetch if this is a mongo cursor because this should return an array
  return _.isFunction(ret.fetch) ? ret.fetch() : ret;
};

QBProto._applyMethodOnCursor = function _applyMethodOnCursor(methodName, args) {
  const ret = this._runNotFetch();

  // Call methodName, but error if this is not actually a read query
  if (_.isFunction(ret[methodName])) {
    return ret[methodName].apply(ret, args);
  } else {
    throw new Error(`Can only call ${methodName}() on select queries.`);
  }
};

// Minimongo cursor methods
[
  'fetch',
  'observe',
  'observeChanges',
  'forEach',
  'map',
  'count'
].forEach((methodName) => {
  QBProto[methodName] = function () {
    return this._applyMethodOnCursor(methodName, arguments);
  };
});

PG.Model = class Model {
  constructor(doc) {
    _.extend(this, doc);
  }
}

// XXX will only work with the methods of Bookshelf as they use the
// version of BlueBird that we supplied over a transform with exposify.
PG.await = window.__Sync_BlueBird.await;
