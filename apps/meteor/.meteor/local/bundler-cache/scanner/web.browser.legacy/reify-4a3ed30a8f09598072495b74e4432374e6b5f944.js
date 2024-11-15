'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var utils = require('./utils.js');
var query = require('./query.js');
var notifyManager = require('./notifyManager.js');
var subscribable = require('./subscribable.js');

// CLASS
class QueryCache extends subscribable.Subscribable {
  constructor(config) {
    super();
    this.config = config || {};
    this.queries = [];
    this.queriesMap = {};
  }

  build(client, options, state) {
    var _options$queryHash;

    const queryKey = options.queryKey;
    const queryHash = (_options$queryHash = options.queryHash) != null ? _options$queryHash : utils.hashQueryKeyByOptions(queryKey, options);
    let query$1 = this.get(queryHash);

    if (!query$1) {
      query$1 = new query.Query({
        cache: this,
        logger: client.getLogger(),
        queryKey,
        queryHash,
        options: client.defaultQueryOptions(options),
        state,
        defaultOptions: client.getQueryDefaults(queryKey)
      });
      this.add(query$1);
    }

    return query$1;
  }

  add(query) {
    if (!this.queriesMap[query.queryHash]) {
      this.queriesMap[query.queryHash] = query;
      this.queries.push(query);
      this.notify({
        type: 'added',
        query
      });
    }
  }

  remove(query) {
    const queryInMap = this.queriesMap[query.queryHash];

    if (queryInMap) {
      query.destroy();
      this.queries = this.queries.filter(x => x !== query);

      if (queryInMap === query) {
        delete this.queriesMap[query.queryHash];
      }

      this.notify({
        type: 'removed',
        query
      });
    }
  }

  clear() {
    notifyManager.notifyManager.batch(() => {
      this.queries.forEach(query => {
        this.remove(query);
      });
    });
  }

  get(queryHash) {
    return this.queriesMap[queryHash];
  }

  getAll() {
    return this.queries;
  }

  find(arg1, arg2) {
    const [filters] = utils.parseFilterArgs(arg1, arg2);

    if (typeof filters.exact === 'undefined') {
      filters.exact = true;
    }

    return this.queries.find(query => utils.matchQuery(filters, query));
  }

  findAll(arg1, arg2) {
    const [filters] = utils.parseFilterArgs(arg1, arg2);
    return Object.keys(filters).length > 0 ? this.queries.filter(query => utils.matchQuery(filters, query)) : this.queries;
  }

  notify(event) {
    notifyManager.notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(event);
      });
    });
  }

  onFocus() {
    notifyManager.notifyManager.batch(() => {
      this.queries.forEach(query => {
        query.onFocus();
      });
    });
  }

  onOnline() {
    notifyManager.notifyManager.batch(() => {
      this.queries.forEach(query => {
        query.onOnline();
      });
    });
  }

}

exports.QueryCache = QueryCache;
//# sourceMappingURL=queryCache.js.map
