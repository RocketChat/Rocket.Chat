module.export({QueryCache:()=>QueryCache});let hashQueryKeyByOptions,parseFilterArgs,matchQuery;module.link('./utils.esm.js',{hashQueryKeyByOptions(v){hashQueryKeyByOptions=v},parseFilterArgs(v){parseFilterArgs=v},matchQuery(v){matchQuery=v}},0);let Query;module.link('./query.esm.js',{Query(v){Query=v}},1);let notifyManager;module.link('./notifyManager.esm.js',{notifyManager(v){notifyManager=v}},2);let Subscribable;module.link('./subscribable.esm.js',{Subscribable(v){Subscribable=v}},3);




// CLASS
class QueryCache extends Subscribable {
  constructor(config) {
    super();
    this.config = config || {};
    this.queries = [];
    this.queriesMap = {};
  }

  build(client, options, state) {
    var _options$queryHash;

    const queryKey = options.queryKey;
    const queryHash = (_options$queryHash = options.queryHash) != null ? _options$queryHash : hashQueryKeyByOptions(queryKey, options);
    let query = this.get(queryHash);

    if (!query) {
      query = new Query({
        cache: this,
        logger: client.getLogger(),
        queryKey,
        queryHash,
        options: client.defaultQueryOptions(options),
        state,
        defaultOptions: client.getQueryDefaults(queryKey)
      });
      this.add(query);
    }

    return query;
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
    notifyManager.batch(() => {
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
    const [filters] = parseFilterArgs(arg1, arg2);

    if (typeof filters.exact === 'undefined') {
      filters.exact = true;
    }

    return this.queries.find(query => matchQuery(filters, query));
  }

  findAll(arg1, arg2) {
    const [filters] = parseFilterArgs(arg1, arg2);
    return Object.keys(filters).length > 0 ? this.queries.filter(query => matchQuery(filters, query)) : this.queries;
  }

  notify(event) {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(event);
      });
    });
  }

  onFocus() {
    notifyManager.batch(() => {
      this.queries.forEach(query => {
        query.onFocus();
      });
    });
  }

  onOnline() {
    notifyManager.batch(() => {
      this.queries.forEach(query => {
        query.onOnline();
      });
    });
  }

}


//# sourceMappingURL=queryCache.esm.js.map
