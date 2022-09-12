'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var PUBLISH = 0;
var SUBSCRIBE = 1;
var RESET = 2;
var VALUE = 4;

/**
 * Utils includes
 * - a handful of functional utilities inspired by or taken from the [Ramda library](https://ramdajs.com/);
 * - TypeScript crutches - the [[tup]] function.
 *
 * Use these for your convenience - they are here so that urx is zero-dependency package.
 *
 * @packageDocumentation
 */

/**
 * Performs left to right composition of two functions.
 */
function compose(a, b) {
  return function (arg) {
    return a(b(arg));
  };
}
/**
 * Takes a value and applies a function to it.
 */

function thrush(arg, proc) {
  return proc(arg);
}
/**
 * Takes a 2 argument function and partially applies the first argument.
 */

function curry2to1(proc, arg1) {
  return function (arg2) {
    return proc(arg1, arg2);
  };
}
/**
 * Takes a 1 argument function and returns a function which when called, executes it with the provided argument.
 */

function curry1to0(proc, arg) {
  return function () {
    return proc(arg);
  };
}
/**
 * Returns a function which extracts the property from from the passed object.
 */

function prop(property) {
  return function (object) {
    return object[property];
  };
}
/**
 * Calls callback with the first argument, and returns it.
 */

function tap(arg, proc) {
  proc(arg);
  return arg;
}
/**
 *  Utility function to help typescript figure out that what we pass is a tuple and not a generic array.
 *  Taken from (this StackOverflow tread)[https://stackoverflow.com/questions/49729550/implicitly-create-a-tuple-in-typescript/52445008#52445008]
 */

function tup() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return args;
}
/**
 * Calls the passed function.
 */

function call(proc) {
  proc();
}
/**
 * returns a function which when called always returns the passed value
 */

function always(value) {
  return function () {
    return value;
  };
}
/**
 * returns a function which calls all passed functions in the passed order.
 * joinProc does not pass arguments or collect return values.
 */

function joinProc() {
  for (var _len2 = arguments.length, procs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    procs[_key2] = arguments[_key2];
  }

  return function () {
    procs.map(call);
  };
}
function noop() {}

/**
 * urx Actions operate on streams - `publish` publishes data in a stream, and `subscribe` attaches a subscription to a stream.
 * @packageDocumentation
 */
/**
 * Subscribes the specified [[Subscription]] to the updates from the Emitter.
 * The emitter calls the subscription with the new data each time new data is published into it.
 *
 * ```ts
 * const foo = stream<number>();
 * subscribe(foo, (value) => console.log(value));
 * ```
 *
 * @returns an [[Unsubscribe]] handle  - calling it will unbind the subscription from the emitter.
 *```ts
 * const foo = stream<number>();
 * const unsub = subscribe(foo, (value) => console.log(value));
 * unsub();
 *```
 */

function subscribe(emitter, subscription) {
  return emitter(SUBSCRIBE, subscription);
}
/**
 * Publishes the value into the passed [[Publisher]].
 *
 * ```ts
 * const foo = stream<number>();
 * publish(foo, 42);
 * ```
 */

function publish(publisher, value) {
  publisher(PUBLISH, value);
}
/**
 * Clears all subscriptions from the [[Emitter]].
 * ```ts
 * const foo = stream<number>();
 * subscribe(foo, (value) => console.log(value));
 * reset(foo);
 * publish(foo, 42);
 * ```
 */

function reset(emitter) {
  emitter(RESET);
}
/**
 * Extracts the current value from a stateful stream. Use it only as an escape hatch, as it violates the concept of reactive programming.
 * ```ts
 * const foo = statefulStream(42);
 * console.log(getValue(foo));
 * ```
 */

function getValue(depot) {
  return depot(VALUE);
}
/**
 * Connects two streams - any value emitted from the emitter will be published in the publisher.
 * ```ts
 * const foo = stream<number>();
 * const bar = stream<number>();
 * subscribe(bar, (value) => console.log(`Bar emitted ${value}`));
 *
 * connect(foo, bar);
 * publish(foo);
 * ```
 * @returns an [[Unsubscribe]] handle which will disconnect the two streams.
 */

function connect(emitter, publisher) {
  return subscribe(emitter, curry2to1(publisher, PUBLISH));
}
/**
 * Executes the passed subscription at most once, for the next emit from the emitter.
 * ```ts
 * const foo = stream<number>()
 * handleNext(foo, value => console.log(value)) // called once, with 42
 * publish(foo, 42)
 * publish(foo, 43)
 * ```
 * @returns an [[Unsubscribe]] handle to unbind the subscription if necessary.
 */

function handleNext(emitter, subscription) {
  var unsub = emitter(SUBSCRIBE, function (value) {
    unsub();
    subscription(value);
  });
  return unsub;
}

/**
 * Streams are the basic building blocks of a reactive system. Think of them as the system permanent "data tubes".
 *
 * A stream acts as both an [[Emitter]] and [[Publisher]]. Each stream can have multiple {@link Subscription | Subscriptions}.
 *
 * urx streams are either **stateless** or **stateful**.
 * Stateless streams emit data to existing subscriptions when published, without keeping track of it.
 * Stateful streams remember the last published value and immediately publish it to new subscriptions.
 *
 * ```ts
 * import { stream, statefulStream, publish, subscribe } from "@virtuoso.dev/urx";
 *
 * // foo is a stateless stream
 * const foo = stream<number>();
 *
 * publish(foo, 42);
 * // this subsription will not be called...
 * subscribe(foo, (value) => console.log(value));
 * // it will only catch published values after it
 * publish(foo, 43);
 *
 * // stateful streams always start with an initial value
 * const bar = statefulStream(42);
 *
 * // subscribing to a stateful stream
 * // immediately calls the subscription with the current value
 * subscribe(bar, (value) => console.log(value));
 *
 * // subsequent publishing works just like stateless streams
 * publish(bar, 43);
 * ```
 * @packageDocumentation
 */
/**
 * Constructs a new stateless stream.
 * ```ts
 * const foo = stream<number>();
 * ```
 * @typeParam T the type of values to publish in the stream.
 * @returns a [[Stream]]
 */

function stream() {
  var subscriptions = [];
  return function (action, arg) {
    switch (action) {
      case RESET:
        subscriptions.splice(0, subscriptions.length);
        return;

      case SUBSCRIBE:
        subscriptions.push(arg);
        return function () {
          var indexOf = subscriptions.indexOf(arg);

          if (indexOf > -1) {
            subscriptions.splice(indexOf, 1);
          }
        };

      case PUBLISH:
        subscriptions.slice().forEach(function (subscription) {
          subscription(arg);
        });
        return;

      default:
        throw new Error("unrecognized action " + action);
    }
  };
}
/**
 * Constructs a new stateful stream.
 * ```ts
 * const foo = statefulStream(42);
 * ```
 * @param initial the initial value in the stream.
 * @typeParam T the type of values to publish in the stream. If omitted, the function infers it from the initial value.
 * @returns a [[StatefulStream]]
 */

function statefulStream(initial) {
  var value = initial;
  var innerSubject = stream();
  return function (action, arg) {
    switch (action) {
      case SUBSCRIBE:
        var subscription = arg;
        subscription(value);
        break;

      case PUBLISH:
        value = arg;
        break;

      case VALUE:
        return value;
    }

    return innerSubject(action, arg);
  };
}
/**
 * Event handlers are special emitters which can have **at most one active subscription**.
 * Subscribing to an event handler unsubscribes the previous subscription, if present.
 * ```ts
 * const foo = stream<number>();
 * const fooEvent = eventHandler(foo);
 *
 * // will be called once with 42
 * subscribe(fooEvent, (value) => console.log(`Sub 1 ${value}`));
 * publish(foo, 42);
 *
 * // unsubscribes sub 1
 * subscribe(fooEvent, (value) => console.log(`Sub 2 ${value}`));
 * publish(foo, 43);
 * ```
 * @param emitter the source emitter.
 * @returns the single-subscription emitter.
 */

function eventHandler(emitter) {
  var unsub;
  var currentSubscription;

  var cleanup = function cleanup() {
    return unsub && unsub();
  };

  return function (action, subscription) {
    switch (action) {
      case SUBSCRIBE:
        if (subscription) {
          if (currentSubscription === subscription) {
            return;
          }

          cleanup();
          currentSubscription = subscription;
          unsub = subscribe(emitter, subscription);
          return unsub;
        } else {
          cleanup();
          return noop;
        }

      case RESET:
        cleanup();
        currentSubscription = null;
        return;

      default:
        throw new Error("unrecognized action " + action);
    }
  };
}
/**
 * Creates and connects a "junction" stream to the specified emitter. Often used with [[pipe]], to avoid the multiple evaluation of operator sets.
 *
 * ```ts
 * const foo = stream<number>();
 *
 * const fooX2 = pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`multiplying ${value}`);
 *     return value * 2;
 *   })
 * );
 *
 * subscribe(fooX2, (value) => console.log(value));
 * subscribe(fooX2, (value) => console.log(value));
 *
 * publish(foo, 42); // executes the map operator twice for each subscription.
 *
 * const sharedFooX2 = streamFromEmitter(pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`shared multiplying ${value}`);
 *     return value * 2;
 *   })
 * ));
 *
 * subscribe(sharedFooX2, (value) => console.log(value));
 * subscribe(sharedFooX2, (value) => console.log(value));
 *
 * publish(foo, 42);
 *```
 * @returns the resulting stream.
 */

function streamFromEmitter(emitter) {
  return tap(stream(), function (stream) {
    return connect(emitter, stream);
  });
}
/**
 * Creates and connects a "junction" stateful stream to the specified emitter. Often used with [[pipe]], to avoid the multiple evaluation of operator sets.
 *
 * ```ts
 * const foo = stream<number>();
 *
 * const fooX2 = pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`multiplying ${value}`);
 *     return value * 2;
 *   })
 * );
 *
 * subscribe(fooX2, (value) => console.log(value));
 * subscribe(fooX2, (value) => console.log(value));
 *
 * publish(foo, 42); // executes the map operator twice for each subscription.
 *
 * const sharedFooX2 = statefulStreamFromEmitter(pipe(
 *   foo,
 *   map((value) => {
 *     console.log(`shared multiplying ${value}`);
 *     return value * 2;
 *   })
 * ), 42);
 *
 * subscribe(sharedFooX2, (value) => console.log(value));
 * subscribe(sharedFooX2, (value) => console.log(value));
 *
 * publish(foo, 42);
 *```
 * @param initial the initial value in the stream.
 * @returns the resulting stateful stream.
 */

function statefulStreamFromEmitter(emitter, initial) {
  return tap(statefulStream(initial), function (stream) {
    return connect(emitter, stream);
  });
}

/**
 *
 * Stream values can be transformed and controlled by {@link pipe | **piping**} through **operators**.
 * urx includes several operators like [[map]], [[filter]], [[scan]], and [[throttleTime]].
 * The [[withLatestFrom]] operator allows the combination of values from other streams.
 *
 * ```ts
 * const foo = stream<number>()
 *
 * // create an emitter that first adds 2 to the passed value, then multiplies it by * 2
 * const bar = pipe(foo, map(value => value + 2), map(value => value * 2))
 * subscribe(bar, value => console.log(value))
 * publish(foo, 2) // outputs 8
 * ```
 *
 * ### Implementing Custom Operators
 * To implement your own operators, implement the [[Operator]] interface.
 * @packageDocumentation
 */
/** @internal */

function combineOperators() {
  for (var _len = arguments.length, operators = new Array(_len), _key = 0; _key < _len; _key++) {
    operators[_key] = arguments[_key];
  }

  return function (subscriber) {
    return operators.reduceRight(thrush, subscriber);
  };
}

function pipe(source) {
  for (var _len2 = arguments.length, operators = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    operators[_key2 - 1] = arguments[_key2];
  }

  // prettier-ignore
  var project = combineOperators.apply(void 0, operators);
  return function (action, subscription) {
    switch (action) {
      case SUBSCRIBE:
        return subscribe(source, project(subscription));

      case RESET:
        reset(source);
        return;

      default:
        throw new Error("unrecognized action " + action);
    }
  };
}
/**
 * The default [[Comparator]] for [[distinctUntilChanged]] and [[duc]].
 */

function defaultComparator(previous, next) {
  return previous === next;
}
/**
 * Filters out identical values. Pass an optional [[Comparator]] if you need to filter non-primitive values.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, distinctUntilChanged()),
 *  console.log
 * ) // will be called only once
 *
 * publish(foo, 42)
 * publish(foo, 42)
 * ```
 */

function distinctUntilChanged(comparator) {
  if (comparator === void 0) {
    comparator = defaultComparator;
  }

  var current;
  return function (done) {
    return function (next) {
      if (!comparator(current, next)) {
        current = next;
        done(next);
      }
    };
  };
}
/**
 * Filters out values for which the predicator does not return `true`-ish.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, filter(value => value % 2 === 0)),
 *  console.log
 * ) // will be called only with even values
 *
 * publish(foo, 2)
 * publish(foo, 3)
 * publish(foo, 4)
 * publish(foo, 5)
 * ```
 */

function filter(predicate) {
  return function (done) {
    return function (value) {
      predicate(value) && done(value);
    };
  };
}
/**
 * Maps values using the provided project function.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, map(value => value * 2)),
 *  console.log
 * ) // 4, 6
 *
 * publish(foo, 2)
 * publish(foo, 3)
 * ```
 */

function map(project) {
  return function (done) {
    return compose(done, project);
  };
}
/**
 * Maps values to the hard-coded value.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, mapTo(3)),
 *  console.log
 * ) // 3, 3
 *
 * publish(foo, 1)
 * publish(foo, 2)
 * ```
 */

function mapTo(value) {
  return function (done) {
    return function () {
      return done(value);
    };
  };
}
/**
 * Works like Array#reduce.
 * Applies an accumulator function on the emitter, and outputs intermediate result. Starts with the initial value.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, scan((acc, value) => acc + value, 2),
 *  console.log
 * ) // 3, 5
 *
 * publish(foo, 1)
 * publish(foo, 2)
 * ```
 */

function scan(scanner, initial) {
  return function (done) {
    return function (value) {
      return done(initial = scanner(initial, value));
    };
  };
}
/**
 * Skips the specified amount of values from the emitter.
 * ```ts
 * const foo = stream<number>()
 *
 * subscribe(
 *  pipe(foo, skip(2)),
 *  console.log
 * ) // 3, 4
 *
 * publish(foo, 1) // skipped
 * publish(foo, 2) // skipped
 * publish(foo, 3)
 * publish(foo, 4)
 * ```
 */

function skip(times) {
  return function (done) {
    return function (value) {
      times > 0 ? times-- : done(value);
    };
  };
}
/**
 * Throttles flowing values at the provided interval in milliseconds.
 * [Throttle VS Debounce in SO](https://stackoverflow.com/questions/25991367/difference-between-throttling-and-debouncing-a-function).
 *
 * ```ts
 *  const foo = stream<number>()
 *  publish(foo, 1)
 *
 *  setTimeout(() => publish(foo, 2), 20)
 *  setTimeout(() => publish(foo, 3), 20)
 *
 *  subscribe(pipe(foo, throttleTime(50)), val => {
 *    console.log(value); // 3
 *  })
 * ```
 */

function throttleTime(interval) {
  var currentValue;
  var timeout;
  return function (done) {
    return function (value) {
      currentValue = value;

      if (timeout) {
        return;
      }

      timeout = setTimeout(function () {
        timeout = undefined;
        done(currentValue);
      }, interval);
    };
  };
}
/**
 * Debounces flowing values at the provided interval in milliseconds.
 * [Throttle VS Debounce in SO](https://stackoverflow.com/questions/25991367/difference-between-throttling-and-debouncing-a-function).
 *
 * ```ts
 *  const foo = stream<number>()
 *  publish(foo, 1)
 *
 *  setTimeout(() => publish(foo, 2), 20)
 *  setTimeout(() => publish(foo, 3), 20)
 *
 *  subscribe(pipe(foo, debounceTime(50)), val => {
 *    console.log(value); // 3
 *  })
 * ```
 */

function debounceTime(interval) {
  var currentValue;
  var timeout;
  return function (done) {
    return function (value) {
      currentValue = value;

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(function () {
        done(currentValue);
      }, interval);
    };
  };
}
function withLatestFrom() {
  for (var _len3 = arguments.length, sources = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    sources[_key3] = arguments[_key3];
  }

  var values = new Array(sources.length);
  var called = 0;
  var pendingCall = null;
  var allCalled = Math.pow(2, sources.length) - 1;
  sources.forEach(function (source, index) {
    var bit = Math.pow(2, index);
    subscribe(source, function (value) {
      var prevCalled = called;
      called = called | bit;
      values[index] = value;

      if (prevCalled !== allCalled && called === allCalled && pendingCall) {
        pendingCall();
        pendingCall = null;
      }
    });
  });
  return function (done) {
    return function (value) {
      var call = function call() {
        return done([value].concat(values));
      };

      if (called === allCalled) {
        call();
      } else {
        pendingCall = call;
      }
    };
  };
}

/**
 * Transformers change and combine streams, similar to operators.
 * urx comes with two combinators - [[combineLatest]] and [[merge]], and one convenience filter - [[duc]].
 *
 * @packageDocumentation
 */
/**
 * Merges one or more emitters from the same type into a new Emitter which emits values from any of the source emitters.
 * ```ts
 * const foo = stream<number>()
 * const bar = stream<number>()
 *
 * subscribe(merge(foo, bar), (value) => console.log(value)) // 42, 43
 *
 * publish(foo, 42)
 * publish(bar, 43)
 * ```
 */

function merge() {
  for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) {
    sources[_key] = arguments[_key];
  }

  return function (action, subscription) {
    switch (action) {
      case SUBSCRIBE:
        return joinProc.apply(void 0, sources.map(function (source) {
          return subscribe(source, subscription);
        }));

      case RESET:
        // do nothing, we are stateless
        return;

      default:
        throw new Error("unrecognized action " + action);
    }
  };
}
/**
 * A convenience wrapper that emits only the distinct values from the passed Emitter. Wraps [[pipe]] and [[distinctUntilChanged]].
 *
 * ```ts
 * const foo = stream<number>()
 *
 * // this line...
 * const a = duc(foo)
 *
 * // is equivalent to this
 * const b = pipe(distinctUntilChanged(foo))
 * ```
 *
 * @param source The source emitter.
 * @param comparator optional custom comparison function for the two values.
 *
 * @typeParam T the type of the value emitted by the source.
 *
 * @returns the resulting emitter.
 */

function duc(source, comparator) {
  if (comparator === void 0) {
    comparator = defaultComparator;
  }

  return pipe(source, distinctUntilChanged(comparator));
}
function combineLatest() {
  var innerSubject = stream();

  for (var _len2 = arguments.length, emitters = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    emitters[_key2] = arguments[_key2];
  }

  var values = new Array(emitters.length);
  var called = 0;
  var allCalled = Math.pow(2, emitters.length) - 1;
  emitters.forEach(function (source, index) {
    var bit = Math.pow(2, index);
    subscribe(source, function (value) {
      values[index] = value;
      called = called | bit;

      if (called === allCalled) {
        publish(innerSubject, values);
      }
    });
  });
  return function (action, subscription) {
    switch (action) {
      case SUBSCRIBE:
        if (called === allCalled) {
          subscription(values);
        }

        return subscribe(innerSubject, subscription);

      case RESET:
        return reset(innerSubject);

      default:
        throw new Error("unrecognized action " + action);
    }
  };
}

/**
 * `system` defines a specification of a system - its constructor, dependencies and if it should act as a singleton in a system dependency tree.
 * When called, system returns a [[SystemSpec]], which is then initialized along with its dependencies by passing it to [[init]].
 *
 * ```ts
 * @import { subscribe, publish, system, init, tup, connect, map, pipe } from 'urx'
 *
 * // a simple system with two streams
 * const sys1 = system(() => {
 *  const a = stream<number>()
 *  const b = stream<number>()
 *
 *  connect(pipe(a, map(value => value * 2)), b)
 *  return { a, b }
 * })
 *
 * // a second system which depends on the streams from the first one
 * const sys2 = system(([ {a, b} ]) => {
 *  const c = stream<number>()
 *  connect(pipe(b, map(value => value * 2)), c)
 *  // re-export the `a` stream, keep `b` internal
 *  return { a, c }
 * }, tup(sys1))
 *
 * // init will recursively initialize sys2 dependencies, in this case sys1
 * const { a, c } = init(sys2)
 * subscribe(c, c => console.log(`Value multiplied by 4`, c))
 * publish(a, 2)
 * ```
 *
 * #### Singletons in Dependency Tree
 *
 * By default, systems will be initialized only once if encountered multiple times in the dependency tree.
 * In the below dependency system tree, systems `b` and `c` will receive the same stream instances from system `a` when system `d` is initialized.
 * ```txt
 *   a
 *  / \
 * b   c
 *  \ /
 *   d
 * ```
 * If `a` gets `{singleton: false}` as a last argument, `init` creates two separate instances - one for `b` and one for `c`.
 *
 * @param constructor the system constructor function. Initialize and connect the streams in its body.
 *
 * @param dependencies the system dependencies, which the constructor will receive as arguments.
 * Use the [[tup]] utility **For TypeScript type inference to work correctly**.
 * ```ts
 * const sys3 = system(() => { ... }, tup(sys2, sys1))
 * ```
 * @param __namedParameters Options
 * @param singleton determines if the system will act as a singleton in a system dependency tree. `true` by default.
 */
function system(constructor, dependencies, _temp) {
  if (dependencies === void 0) {
    dependencies = [];
  }

  var _ref = _temp === void 0 ? {
    singleton: true
  } : _temp,
      singleton = _ref.singleton;

  return {
    id: id(),
    constructor: constructor,
    dependencies: dependencies,
    singleton: singleton
  };
}
/** @internal */

var id = function id() {
  return Symbol();
};
/**
 * Initializes a [[SystemSpec]] by recursively initializing its dependencies.
 *
 * ```ts
 * // a simple system with two streams
 * const sys1 = system(() => {
 *  const a = stream<number>()
 *  const b = stream<number>()
 *
 *  connect(pipe(a, map(value => value * 2)), b)
 *  return { a, b }
 * })
 *
 * const { a, b } = init(sys1)
 * subscribe(b, b => console.log(b))
 * publish(a, 2)
 * ```
 *
 * @returns the [[System]] constructed by the spec constructor.
 * @param systemSpec the system spec to initialize.
 */


function init(systemSpec) {
  var singletons = new Map();

  var _init = function _init(_ref2) {
    var id = _ref2.id,
        constructor = _ref2.constructor,
        dependencies = _ref2.dependencies,
        singleton = _ref2.singleton;

    if (singleton && singletons.has(id)) {
      return singletons.get(id);
    }

    var system = constructor(dependencies.map(function (e) {
      return _init(e);
    }));

    if (singleton) {
      singletons.set(id, system);
    }

    return system;
  };

  return _init(systemSpec);
}

exports.always = always;
exports.call = call;
exports.combineLatest = combineLatest;
exports.compose = compose;
exports.connect = connect;
exports.curry1to0 = curry1to0;
exports.curry2to1 = curry2to1;
exports.debounceTime = debounceTime;
exports.defaultComparator = defaultComparator;
exports.distinctUntilChanged = distinctUntilChanged;
exports.duc = duc;
exports.eventHandler = eventHandler;
exports.filter = filter;
exports.getValue = getValue;
exports.handleNext = handleNext;
exports.init = init;
exports.joinProc = joinProc;
exports.map = map;
exports.mapTo = mapTo;
exports.merge = merge;
exports.noop = noop;
exports.pipe = pipe;
exports.prop = prop;
exports.publish = publish;
exports.reset = reset;
exports.scan = scan;
exports.skip = skip;
exports.statefulStream = statefulStream;
exports.statefulStreamFromEmitter = statefulStreamFromEmitter;
exports.stream = stream;
exports.streamFromEmitter = streamFromEmitter;
exports.subscribe = subscribe;
exports.system = system;
exports.tap = tap;
exports.throttleTime = throttleTime;
exports.thrush = thrush;
exports.tup = tup;
exports.withLatestFrom = withLatestFrom;
//# sourceMappingURL=urx.cjs.development.js.map
