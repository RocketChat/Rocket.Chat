PG.defaultConnectionUrl = process.env.POSTGRESQL_URL || 'postgres://127.0.0.1/postgres';

var pg = Npm.require('pg');

PG._npmModule = pg;

var pgClient = Meteor.wrapAsync(pg.connect.bind(pg))(PG.defaultConnectionUrl);
var livePg = new PgLiveQuery({
  connectionUrl: PG.defaultConnectionUrl,
  channel: 'simple_pg_' + Random.id(4)
});
PG._livePg = livePg;

PG.Query = function (sqlString, params, name) {
  if (! name && (typeof params === 'string')) {
    name = params;
    params = [];
  }

  this.name = name;
  this.sqlString = sqlString;
  this.params = params || [];
};

PG.Query.prototype.observe = function (cbs) {
  cbs = cbs || {};
  // poll validators shouldn't be empty
  var handle = livePg.select(this.sqlString, this.params, {}, cbs);

  livePg.on('error', function (err) {
    throw err;
  });

  return handle;
};

PG.Query.prototype._publishCursor = function (sub) {
  var table = this.name;

  var self = this;

  var observeHandle = this.observe({
    added: function (doc) {
      sub.added(table, String(doc.id), doc);
    },
    changed: function (newDoc, oldDoc) {
      sub.changed(table, String(newDoc.id), makeChangedFields(newDoc, oldDoc));
    },
    removed: function (doc) {
      sub.removed(table, String(doc.id));
    }
  });

  sub.onStop(function () {observeHandle.stop();});
};


// XXX copy pasted, should be taken from the diff-sequence package once this change is out in Meteor 1.2
var diffObjects = function (left, right, callbacks) {
  _.each(left, function (leftValue, key) {
    if (_.has(right, key))
      callbacks.both && callbacks.both(key, leftValue, right[key]);
    else
      callbacks.leftOnly && callbacks.leftOnly(key, leftValue);
  });
  if (callbacks.rightOnly) {
    _.each(right, function(rightValue, key) {
      if (!_.has(left, key))
        callbacks.rightOnly(key, rightValue);
    });
  }
};


// XXX copy pasted, should be taken from the diff-sequence package once this change is out in Meteor 1.2
var makeChangedFields = function (newDoc, oldDoc) {
  var fields = {};
  diffObjects(oldDoc, newDoc, {
    leftOnly: function (key, value) {
      fields[key] = undefined;
    },
    rightOnly: function (key, value) {
      fields[key] = value;
    },
    both: function (key, leftValue, rightValue) {
      if (!EJSON.equals(leftValue, rightValue))
        fields[key] = rightValue;
    }
  });
  return fields;
};
