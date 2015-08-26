const {EventEmitter} = Npm.require('events');
const Future = Npm.require('fibers/future');
const pg = Npm.require('pg');
const {murmur3} = Npm.require('murmurhash-js');

PgLiveQuery = class PgLiveQuery extends EventEmitter {
  constructor({connectionUrl, channel}) {
    super();

    this.connectionUrl = connectionUrl;
    this.channel = channel || Random.id(5);
    this.triggerFunction = 'livequery_' + this.channel;
    this.cleanupCbs = [];
    this.queries = {};
    this.outstandingPayloads = {};
    this.queue = [];
    this.queriesByTable = {};
    this.drainQueue = false;

    this.queryCallbacks = {};

    this._setupTriggers();
    this._setupListener();
    this._drainQueue();
  }

  // main interface
  select(
    // sql query
    query,
    // params that replace $1, $2, $3, etc
    params = [],
    // callbacks that approve/disaprove the polls on triggers
    pollValidators={},
    // additional callbacks for "update", specific to this query
    callbacks = {}) {
      const queryHash = murmur3(JSON.stringify([ query, params ]));

      const added = callbacks.added || noop;
      const changed = callbacks.changed || noop;
      const removed = callbacks.removed || noop;

      const cb = (updates, qh) => {
        if (queryHash !== qh) return;
        updates.removed.forEach(v => removed(v));
        updates.changed.forEach((v) => changed(v[0], v[1]));
        updates.added.forEach(v => added(v));
      };

      const handle = {
        stop: () => {
          this._stopSelect(handle);
        },
        _queryHash: queryHash,
        _cb: cb
      };

      this.on('update', cb);
      this._setupSelect(query, params, pollValidators, handle);

      // seed initial
      const update = this._processDiff({}, {}, this.queries[queryHash].data);
      cb(update, queryHash);

      return handle;
  }

  // stop all activity
  stop() {
    const queries = Object.keys(this.queriesByTable).map((table) => {
      return 'DROP TRIGGER IF EXISTS "' +
             this.channel + '_' + table + '" ON "' + table + '"';
    });
    queries.push('DROP FUNCTION "' + this.triggerFunction + '"() CASCADE');
    this._runQueries (queries);

    this.cleanupCbs.forEach(cb => cb());
  }

  // Required to work with the write fence.
  // Adds the "write" (object that can be committed) to the queue for
  // the table. Next time a repoll for the table-dependent queries
  // happens, the writes will be committed.
  appendPendingWrite(table, write) {
    const queries = this.queriesByTable[table];
    const activeQueriesExist = queries.some(
      q => this.queries[q].status !== 'stopped');

    if (activeQueriesExist) {
      // XXX a pretty hacky way to wait until every query commits
      write._pendings = 0;
      queries.forEach((q) => {
        if (this.queries[q].status === 'stopped')
          return;

        write._pendings++;
        this.queries[q].pendingWrites.push(write);
      });
    } else {
      // no active observes for this table
      write.committed();
    }
  }

  // The method enforcing a repoll for every query that observes the
  // given table. After repoll, commits the pending writes on a write
  // fence
  scheduleRepoll(table) {
    const inQueue = {};
    this.queue.forEach(q => inQueue[q] = true);

    this.queriesByTable[table].forEach((q) => {
      if (! inQueue[q])
        this.queue.push(q);
    });

    this._scheduleQueueDrain();
  }

  _setupSelect(query, params, pollValidators, handle) {
    const queryHash = handle._queryHash;

    if (
      (queryHash in this.queries) &&
      this.queries[queryHash].status !== 'stopped') {
      // dedup
      const queryBuffer = this.queries[queryHash];
      queryBuffer.handles.push(handle);

      // XXX pollValidators are dropped in this case? What if they
      // were different from the current ones?

      // wait until it is populated
      if (queryBuffer.status === 'initializing') {
        queryBuffer.initializedFuture.wait();
      }
      return;
    }

    // this is a new query!
    const newBuffer = {
      // the inputs
      query,
      params,
      pollValidators,
      handles: [handle],
      // where we store the working set
      data: {},
      // until initialized, deduplicated queries should await
      // initializing/active/stopped
      status: 'initializing',
      initializedFuture: new Future,
      // a queue for the write fence
      pendingWrites: []
    };

    // add immediately before any yields, so the new deduped queries see it
    this.queries[queryHash] = newBuffer;

    // attach triggers
    const tablesInQuery =
      findDependentRelations(this.client, query, params);
    const triggersQueries = [];
    tablesInQuery.forEach((table) => {
      if (table in this.queriesByTable) {
        if (this.queriesByTable[table].indexOf(queryHash) === -1)
          this.queriesByTable[table].push(queryHash);
        return;
      }

      this.queriesByTable[table] = [queryHash];
      const triggerName = this.channel + '_' + table;
      triggersQueries.push(
        'DROP TRIGGER IF EXISTS "' + triggerName + '" ON "' + table + '"');
      triggersQueries.push(
        'CREATE TRIGGER "' + triggerName + '" ' +
        'AFTER INSERT OR UPDATE OR DELETE ON "' + table + '" ' +
        'FOR EACH ROW EXECUTE PROCEDURE "' + this.triggerFunction + '"()');
    });

    if (triggersQueries.length !== 0) {
      this._runQueries(triggersQueries);
    }

    this.queue.push(queryHash);
    this._scheduleQueueDrain();
    if (newBuffer.status === 'initializing')
      newBuffer.initializedFuture.wait();
  }

  _stopSelect(handle) {
    this.removeListener('update', handle._cb);
    const queryBuffer = this.queries[handle._queryHash];
    const pos = queryBuffer.handles.indexOf(handle);
    if (pos > -1) {
      queryBuffer.handles.splice(pos, 1);
    }
    if (! queryBuffer.handles.length) {
      this._stopQuery(handle._queryHash);
    }
  }

  _stopQuery(queryHash) {
    // stop buffer
    const queryBuffer = this.queries[queryHash];
    queryBuffer.status = 'stopped';

    // remove from the queue updates
    this.queue = this.queue.filter(hash => hash !== queryHash);

    // remove from queriesByTable
    const {query, params} = queryBuffer;
    const tablesInQuery =
      findDependentRelations(this.client, query, params);

    tablesInQuery.forEach((table) => {
      const pos = this.queriesByTable[table].indexOf(queryHash);
      if (pos > -1) {
        this.queriesByTable[table].splice(pos, 1);
        if (! this.queriesByTable[table].length)
          this._stopTableTriggers(table);
      }
    });

    // schedule remove buffer
    Meteor.setTimeout(() => {
      if (this.queries[queryHash].status === 'stopped')
        delete this.queries[queryHash];
    }, 0);
  }

  _setupTriggers() {
    const {triggerFunction, channel} = this;
    this._runQueries(
      [loadQuery('setup-triggers', { triggerFunction, channel })],
      (err) => {
        if (err) {
          this.emit('error', err);
        }
      }
    );
  }

  _stopTableTriggers() {
    // right now it is too hard to deal with the concurrency of
    // adding/removing triggers
    // so we cleanup triggers in the very-very end
  }

  _setupListener() {
    const allFuture = new Future;
    const Mbe = Meteor.bindEnvironment;

    pg.connect(this.connectionUrl, Mbe((error, client, done) => {
      if (error) {
        allFuture.throw(error);
        return;
      }

      this.client = client;
      this.client.querySync =
        Meteor.wrapAsync(this.client.query.bind(this.client));
      this.cleanupCbs.push(done);

      client.query('LISTEN "' + this.channel + '"', Mbe((error) => {
        if (error) { this.emit('error', error); }
      }));


      client.on('notification', Mbe((info) => {
        let payload = this._processNotification(info.payload);
        // Only continue if full notification has arrived
        if (payload === null) return;

        try {
          payload = JSON.parse(payload);
        } catch(error) {
          this.emit('error', new Error('INVALID_NOTIFICATION ' + payload));
          return;
        }

        if (payload.table in this.queriesByTable) {
          this.queriesByTable[payload.table].forEach((queryHash) => {
            const queryBuffer = this.queries[queryHash];
            if ((queryBuffer.pollValidators
                // Check for true response from manual trigger
                && payload.table in queryBuffer.pollValidators
                && (payload.op === 'UPDATE'
                  // Rows changed in an UPDATE operation must check old and new
                  ? queryBuffer.pollValidators[payload.table](payload.new_data[0])
                    || queryBuffer.pollValidators[payload.table](payload.old_data[0])
                  // Rows changed in INSERT/DELETE operations only check once
                  : queryBuffer.pollValidators[payload.table](payload.data[0])))
              || (queryBuffer.pollValidators
                // No manual trigger for this table, always refresh
                && !(payload.table in  queryBuffer.pollValidators))
              // No manual triggers at all, always refresh
              || !queryBuffer.pollValidators) {
                this.queue.push(queryHash);
                this._scheduleQueueDrain();
            }
          });
        }
      }));

      allFuture.return();
    }));

    allFuture.wait();
  }

  _updateQuery(queryHash) {
    const queryBuffer = this.queries[queryHash];
    const oldHashes = _.values(queryBuffer.data).map(row => row._hash);

    const client = this.client;
    const queryParams = queryBuffer.params.concat([ oldHashes ]);

    const writesToCommit = queryBuffer.pendingWrites.splice(
      0, queryBuffer.pendingWrites.length);

    const result = client.querySync(loadQuery('poll', {
      query: queryBuffer.query,
      // an extra param that we append in our wrapper: old hashes
      hashParam: queryBuffer.params.length + 1,
      stringifiedHashesList: oldHashes.concat('dummy').map(s => '(\'' + s + '\')').join(', ')
    }), queryParams).rows;

    if (queryBuffer.status === 'stopped') {
      // This query was stopped while we were running the query to poll the db.
      // No point doing any extra work.
      return;
    }

    const newData = {};
    const removedHashes = {};
    result.forEach((row) => {
      if (row.removed_hash) {
        if (row.removed_hash === 'dummy')
          return;
        removedHashes[row.removed_hash] = true;
        return;
      }
      if (! row.id)
        throw new Error('LiveQuery requires queries to return a unique non-null `id` column');

      newData[row.id] = row;
    });

    const update = this._processDiff(queryBuffer.data, removedHashes, newData);
    queryBuffer.data = update.newSnapshot;

    // XXX possibly doesn't work: commit writes on next tick, assuming
    // all listeners have processed the "update"/initial observe
    Meteor.defer(function () {
      writesToCommit.forEach((write) => {
        write._pendings--;
        if (write._pendings === 0) {
          // safe to commit, all queries that care about it have fired
          write.committed();
        }
      });
    });

    if (queryBuffer.status === 'active') {
      this.emit('update', update, queryHash);
    } else if (queryBuffer.status === 'initializing') {
      queryBuffer.status = 'active';
      const queryFuture = queryBuffer.initializedFuture;
      queryBuffer.initializedFuture = null;
      queryFuture.return();
    } else {
      throw new Error('This should not happen! Cannot reanimate a stopped livepg observe.');
    }
  }

  _processDiff(oldData, removedHashes, newData) {
    const removed = [];
    const changed = [];
    const added = [];

    const newSnapshot = _.clone(newData);

    Object.keys(oldData).forEach((id) => {
      const oldRow = oldData[id];
      if (! newData[id]) {
        // this row is not updated or created in new poll
        if (removedHashes[oldRow._hash]) {
          // the row was explicitly removed
          removed.push(
            filterHashProperties(oldRow));
        } else {
          // it wasn't removed, just remained the same
          newSnapshot[id] = oldRow;
        }
      }
    });
    Object.keys(newData).forEach((id) => {
      const newRow = newData[id];
      if (oldData[id]) {
        const oldRow = oldData[id];
        if (oldRow._hash !== newRow._hash) {
          changed.push([
            filterHashProperties(newRow),
            filterHashProperties(oldRow)
          ]);
        }
      } else {
        added.push(
          filterHashProperties(newRow));
      }
      newSnapshot[id] = newRow;
    });

    return {added, changed, removed, newSnapshot};
  }

  _scheduleQueueDrain() {
    if (this.drainQueue) return;
    this.drainQueue = true;
    Meteor.setTimeout(this._drainQueue.bind(this), 0);
  }

  // probably should never be called directly except for the first time
  _drainQueue() {
    this.drainQueue = false;
    const queriesToUpdate =
      _.uniq(this.queue.splice(0, this.queue.length));

    queriesToUpdate.forEach((queryHash) => {
      this._updateQuery(queryHash);
    });
  }

  _processNotification(payload) {
    const argSep = [];

    // Notification is 4 parts split by colons
    while (argSep.length < 3) {
      const lastPos = argSep.length ? argSep[argSep.length - 1] + 1 : 0;
      argSep.push(payload.indexOf(':', lastPos));
    }

    const msgHash   = payload.slice(0, argSep[0]);
    const pageCount = payload.slice(argSep[0] + 1, argSep[1]);
    const curPage   = payload.slice(argSep[1] + 1, argSep[2]);
    const msgPart   = payload.slice(argSep[2] + 1, argSep[3]);
    let fullMsg;

    if (pageCount > 1) {
      // Piece together multi-part messages
      if (!(msgHash in this.outstandingPayloads)) {
        this.outstandingPayloads[msgHash] =
          _.range(pageCount).map(function () { return null; });
      }
      this.outstandingPayloads[msgHash][curPage - 1] = msgPart;

      if (this.outstandingPayloads[msgHash].indexOf(null) !== -1) {
        return null; // Must wait for full message
      }

      fullMsg = this.outstandingPayloads[msgHash].join('');

      delete this.outstandingPayloads[msgHash];
    }
    else {
      // Payload small enough to fit in single message
      fullMsg = msgPart;
    }

    return fullMsg;
  }

  _runQueries(queries) {
    const allFuture = new Future;
    const futures = [];

    const Mbe = Meteor.bindEnvironment;
    pg.connect(this.connectionUrl, Mbe((error, client, done) => {
      if (error) { allFuture.throw(error); return; }

      queries.forEach((query) => {
        let params;
        if (query instanceof Array) {
          // Allow array containing [ query_string, params ]
          params = query[1];
          query = query[0];
        } else {
          params = [];
        }

        const future = new Future;
        client.query(query, params, Mbe(function (error, result) {
          if (error) {
            done();
            future.throw(error);
            return;
          }
          future.return(result);
        }));
        futures.push(future);
      });

      Future.wait(futures);
      done();
      allFuture.return(futures.map(future => future.get()));
    }));

    return allFuture.wait();
  }
}

function loadQuery(name, kwargs) {
  const queryTemplate = Assets.getText('observe-driver/' + name + '.sql');
  let query = queryTemplate;
  Object.keys(kwargs).forEach(function (argName) {
    query = query.replace(
      new RegExp('\\\$\\\$' + argName + '\\\$\\\$', 'g'), kwargs[argName]);
  });

  return query;
}

function filterHashProperties(obj) {
  if (obj instanceof Object) {
    return _.omit(obj, '_hash', 'removed_hash');
  }
  throw new Error('bad call of filterHashProperties ' + JSON.stringify(obj));
}

function findDependentRelations(client, query, params) {
  var nodeWalker = function (tree) {
    var found = [];

    var checkNode = function (node) {
      if ('Plans' in node) found = found.concat(nodeWalker(node['Plans']));
      if ('Relation Name' in node) found.push(node['Relation Name']);
    };

    if (tree instanceof Array) tree.forEach(checkNode);
    else checkNode(tree);

    return found;
  };

  const explained = client.querySync('EXPLAIN (FORMAT JSON) ' + query, params);
  return nodeWalker(explained.rows[0]['QUERY PLAN'][0]['Plan']);
}

function noop () {}
