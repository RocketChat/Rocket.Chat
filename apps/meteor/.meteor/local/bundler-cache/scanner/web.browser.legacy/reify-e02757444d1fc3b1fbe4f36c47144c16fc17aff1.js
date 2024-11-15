'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var notifyManager = require('./notifyManager.js');
var mutation = require('./mutation.js');
var utils = require('./utils.js');
var subscribable = require('./subscribable.js');

// CLASS
class MutationCache extends subscribable.Subscribable {
  constructor(config) {
    super();
    this.config = config || {};
    this.mutations = [];
    this.mutationId = 0;
  }

  build(client, options, state) {
    const mutation$1 = new mutation.Mutation({
      mutationCache: this,
      logger: client.getLogger(),
      mutationId: ++this.mutationId,
      options: client.defaultMutationOptions(options),
      state,
      defaultOptions: options.mutationKey ? client.getMutationDefaults(options.mutationKey) : undefined
    });
    this.add(mutation$1);
    return mutation$1;
  }

  add(mutation) {
    this.mutations.push(mutation);
    this.notify({
      type: 'added',
      mutation
    });
  }

  remove(mutation) {
    this.mutations = this.mutations.filter(x => x !== mutation);
    this.notify({
      type: 'removed',
      mutation
    });
  }

  clear() {
    notifyManager.notifyManager.batch(() => {
      this.mutations.forEach(mutation => {
        this.remove(mutation);
      });
    });
  }

  getAll() {
    return this.mutations;
  }

  find(filters) {
    if (typeof filters.exact === 'undefined') {
      filters.exact = true;
    }

    return this.mutations.find(mutation => utils.matchMutation(filters, mutation));
  }

  findAll(filters) {
    return this.mutations.filter(mutation => utils.matchMutation(filters, mutation));
  }

  notify(event) {
    notifyManager.notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(event);
      });
    });
  }

  resumePausedMutations() {
    const pausedMutations = this.mutations.filter(x => x.state.isPaused);
    return notifyManager.notifyManager.batch(() => pausedMutations.reduce((promise, mutation) => promise.then(() => mutation.continue().catch(utils.noop)), Promise.resolve()));
  }

}

exports.MutationCache = MutationCache;
//# sourceMappingURL=mutationCache.js.map
