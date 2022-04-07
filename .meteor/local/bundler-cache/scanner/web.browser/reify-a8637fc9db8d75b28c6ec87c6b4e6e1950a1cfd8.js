module.export({MutationCache:()=>MutationCache});let _inheritsLoose;module.link("@babel/runtime/helpers/esm/inheritsLoose",{default(v){_inheritsLoose=v}},0);let notifyManager;module.link('./notifyManager',{notifyManager(v){notifyManager=v}},1);let Mutation;module.link('./mutation',{Mutation(v){Mutation=v}},2);let matchMutation,noop;module.link('./utils',{matchMutation(v){matchMutation=v},noop(v){noop=v}},3);let Subscribable;module.link('./subscribable',{Subscribable(v){Subscribable=v}},4);



 // TYPES

// CLASS
var MutationCache = /*#__PURE__*/function (_Subscribable) {
  _inheritsLoose(MutationCache, _Subscribable);

  function MutationCache(config) {
    var _this;

    _this = _Subscribable.call(this) || this;
    _this.config = config || {};
    _this.mutations = [];
    _this.mutationId = 0;
    return _this;
  }

  var _proto = MutationCache.prototype;

  _proto.build = function build(client, options, state) {
    var mutation = new Mutation({
      mutationCache: this,
      mutationId: ++this.mutationId,
      options: client.defaultMutationOptions(options),
      state: state,
      defaultOptions: options.mutationKey ? client.getMutationDefaults(options.mutationKey) : undefined,
      meta: options.meta
    });
    this.add(mutation);
    return mutation;
  };

  _proto.add = function add(mutation) {
    this.mutations.push(mutation);
    this.notify(mutation);
  };

  _proto.remove = function remove(mutation) {
    this.mutations = this.mutations.filter(function (x) {
      return x !== mutation;
    });
    mutation.cancel();
    this.notify(mutation);
  };

  _proto.clear = function clear() {
    var _this2 = this;

    notifyManager.batch(function () {
      _this2.mutations.forEach(function (mutation) {
        _this2.remove(mutation);
      });
    });
  };

  _proto.getAll = function getAll() {
    return this.mutations;
  };

  _proto.find = function find(filters) {
    if (typeof filters.exact === 'undefined') {
      filters.exact = true;
    }

    return this.mutations.find(function (mutation) {
      return matchMutation(filters, mutation);
    });
  };

  _proto.findAll = function findAll(filters) {
    return this.mutations.filter(function (mutation) {
      return matchMutation(filters, mutation);
    });
  };

  _proto.notify = function notify(mutation) {
    var _this3 = this;

    notifyManager.batch(function () {
      _this3.listeners.forEach(function (listener) {
        listener(mutation);
      });
    });
  };

  _proto.onFocus = function onFocus() {
    this.resumePausedMutations();
  };

  _proto.onOnline = function onOnline() {
    this.resumePausedMutations();
  };

  _proto.resumePausedMutations = function resumePausedMutations() {
    var pausedMutations = this.mutations.filter(function (x) {
      return x.state.isPaused;
    });
    return notifyManager.batch(function () {
      return pausedMutations.reduce(function (promise, mutation) {
        return promise.then(function () {
          return mutation.continue().catch(noop);
        });
      }, Promise.resolve());
    });
  };

  return MutationCache;
}(Subscribable);