'use strict';
const mimicFn = require("mimic-fn");
const mapAgeCleaner = require("map-age-cleaner");
const decoratorInstanceMap = new WeakMap();
const cacheStore = new WeakMap();
/**
[Memoize](https://en.wikipedia.org/wiki/Memoization) functions - An optimization used to speed up consecutive function calls by caching the result of calls with identical input.

@param fn - Function to be memoized.

@example
```
import mem = require('mem');

let i = 0;
const counter = () => ++i;
const memoized = mem(counter);

memoized('foo');
//=> 1

// Cached as it's the same arguments
memoized('foo');
//=> 1

// Not cached anymore as the arguments changed
memoized('bar');
//=> 2

memoized('bar');
//=> 2
```
*/
const mem = (fn, { cacheKey, cache = new Map(), maxAge } = {}) => {
    if (typeof maxAge === 'number') {
        // TODO: Drop after https://github.com/SamVerschueren/map-age-cleaner/issues/5
        // @ts-expect-error
        mapAgeCleaner(cache);
    }
    const memoized = function (...arguments_) {
        const key = cacheKey ? cacheKey(arguments_) : arguments_[0];
        const cacheItem = cache.get(key);
        if (cacheItem) {
            return cacheItem.data;
        }
        const result = fn.apply(this, arguments_);
        cache.set(key, {
            data: result,
            maxAge: maxAge ? Date.now() + maxAge : Number.POSITIVE_INFINITY
        });
        return result;
    };
    mimicFn(memoized, fn, {
        ignoreNonConfigurable: true
    });
    cacheStore.set(memoized, cache);
    return memoized;
};
/**
@returns A [decorator](https://github.com/tc39/proposal-decorators) to memoize class methods or static class methods.

@example
```
import mem = require('mem');

class Example {
    index = 0

    @mem.decorator()
    counter() {
        return ++this.index;
    }
}

class ExampleWithOptions {
    index = 0

    @mem.decorator({maxAge: 1000})
    counter() {
        return ++this.index;
    }
}
```
*/
mem.decorator = (options = {}) => (target, propertyKey, descriptor) => {
    const input = target[propertyKey];
    if (typeof input !== 'function') {
        throw new TypeError('The decorated value must be a function');
    }
    delete descriptor.value;
    delete descriptor.writable;
    descriptor.get = function () {
        if (!decoratorInstanceMap.has(this)) {
            const value = mem(input, options);
            decoratorInstanceMap.set(this, value);
            return value;
        }
        return decoratorInstanceMap.get(this);
    };
};
/**
Clear all cached data of a memoized function.

@param fn - Memoized function.
*/
mem.clear = (fn) => {
    const cache = cacheStore.get(fn);
    if (!cache) {
        throw new TypeError('Can\'t clear a function that was not memoized!');
    }
    if (typeof cache.clear !== 'function') {
        throw new TypeError('The cache Map can\'t be cleared!');
    }
    cache.clear();
};
module.exports = mem;
