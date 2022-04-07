module.export({memoize:()=>memoize,clear:()=>clear});var store = new WeakMap();
var isCachedValue = function (cachedValue, arg, cache) { return cache.has(arg) && cache.get(arg) === cachedValue; };
var memoize = function (fn, _options) {
    var cache = new Map();
    var cacheTimers = new Map();
    var memoized = function (arg) {
        var cleanUp = function () {
            cache.delete(arg);
            cacheTimers.delete(arg);
        };
        var cachedValue = cache.get(arg);
        if (isCachedValue(cachedValue, arg, cache)) {
            var oldTimer = cacheTimers.get(arg);
            if (oldTimer) {
                clearTimeout(oldTimer);
            }
            if (_options) {
                var timer = setTimeout(cleanUp, _options.maxAge);
                cacheTimers.set(arg, timer);
            }
            return cachedValue;
        }
        var result = fn.call(this, arg);
        cache.set(arg, result);
        if (_options) {
            var timer = setTimeout(cleanUp, _options.maxAge);
            cacheTimers.set(arg, timer);
        }
        return result;
    };
    store.set(memoized, cache);
    return memoized;
};
var clear = function (fn) {
    var cache = store.get(fn);
    cache === null || cache === void 0 ? void 0 : cache.clear();
};
//# sourceMappingURL=memoize.js.map