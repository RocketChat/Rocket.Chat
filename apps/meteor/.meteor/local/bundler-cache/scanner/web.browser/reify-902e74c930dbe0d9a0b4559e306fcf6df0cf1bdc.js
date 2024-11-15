module.export({GroupedVirtuoso:()=>GroupedVirtuoso,LogLevel:()=>LogLevel,TableVirtuoso:()=>TableVirtuoso,Virtuoso:()=>Virtuoso,VirtuosoGrid:()=>VirtuosoGrid,VirtuosoGridMockContext:()=>VirtuosoGridMockContext,VirtuosoMockContext:()=>VirtuosoMockContext});let jsx,jsxs,Fragment;module.link("react/jsx-runtime",{jsx(v){jsx=v},jsxs(v){jsxs=v},Fragment(v){Fragment=v}},0);let React,createElement;module.link("react",{default(v){React=v},createElement(v){createElement=v}},1);let ReactDOM;module.link("react-dom",{default(v){ReactDOM=v}},2);


const PUBLISH = 0;
const SUBSCRIBE = 1;
const RESET = 2;
const VALUE = 4;
function compose(a, b) {
  return (arg) => a(b(arg));
}
function thrush(arg, proc) {
  return proc(arg);
}
function curry2to1(proc, arg1) {
  return (arg2) => proc(arg1, arg2);
}
function curry1to0(proc, arg) {
  return () => proc(arg);
}
function tap(arg, proc) {
  proc(arg);
  return arg;
}
function tup(...args) {
  return args;
}
function call(proc) {
  proc();
}
function always(value) {
  return () => value;
}
function joinProc(...procs) {
  return () => {
    procs.map(call);
  };
}
function isDefined(arg) {
  return arg !== void 0;
}
function noop() {
}
function subscribe(emitter, subscription) {
  return emitter(SUBSCRIBE, subscription);
}
function publish(publisher, value) {
  publisher(PUBLISH, value);
}
function reset(emitter) {
  emitter(RESET);
}
function getValue(depot) {
  return depot(VALUE);
}
function connect(emitter, publisher) {
  return subscribe(emitter, curry2to1(publisher, PUBLISH));
}
function handleNext(emitter, subscription) {
  const unsub = emitter(SUBSCRIBE, (value) => {
    unsub();
    subscription(value);
  });
  return unsub;
}
function stream() {
  const subscriptions = [];
  return (action, arg) => {
    switch (action) {
      case RESET:
        subscriptions.splice(0, subscriptions.length);
        return;
      case SUBSCRIBE:
        subscriptions.push(arg);
        return () => {
          const indexOf = subscriptions.indexOf(arg);
          if (indexOf > -1) {
            subscriptions.splice(indexOf, 1);
          }
        };
      case PUBLISH:
        subscriptions.slice().forEach((subscription) => {
          subscription(arg);
        });
        return;
      default:
        throw new Error(`unrecognized action ${action}`);
    }
  };
}
function statefulStream(initial) {
  let value = initial;
  const innerSubject = stream();
  return (action, arg) => {
    switch (action) {
      case SUBSCRIBE:
        const subscription = arg;
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
function eventHandler(emitter) {
  let unsub;
  let currentSubscription;
  const cleanup = () => unsub && unsub();
  return function(action, subscription) {
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
        throw new Error(`unrecognized action ${action}`);
    }
  };
}
function streamFromEmitter(emitter) {
  return tap(stream(), (stream2) => connect(emitter, stream2));
}
function statefulStreamFromEmitter(emitter, initial) {
  return tap(statefulStream(initial), (stream2) => connect(emitter, stream2));
}
function combineOperators(...operators) {
  return (subscriber) => {
    return operators.reduceRight(thrush, subscriber);
  };
}
function pipe(source, ...operators) {
  const project = combineOperators(...operators);
  return (action, subscription) => {
    switch (action) {
      case SUBSCRIBE:
        return subscribe(source, project(subscription));
      case RESET:
        reset(source);
        return;
    }
  };
}
function defaultComparator(previous, next) {
  return previous === next;
}
function distinctUntilChanged(comparator = defaultComparator) {
  let current;
  return (done) => (next) => {
    if (!comparator(current, next)) {
      current = next;
      done(next);
    }
  };
}
function filter(predicate) {
  return (done) => (value) => {
    predicate(value) && done(value);
  };
}
function map(project) {
  return (done) => compose(done, project);
}
function mapTo(value) {
  return (done) => () => done(value);
}
function scan(scanner, initial) {
  return (done) => (value) => done(initial = scanner(initial, value));
}
function skip(times) {
  return (done) => (value) => {
    times > 0 ? times-- : done(value);
  };
}
function throttleTime(interval) {
  let currentValue = null;
  let timeout;
  return (done) => (value) => {
    currentValue = value;
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      timeout = void 0;
      done(currentValue);
    }, interval);
  };
}
function debounceTime(interval) {
  let currentValue;
  let timeout;
  return (done) => (value) => {
    currentValue = value;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      done(currentValue);
    }, interval);
  };
}
function withLatestFrom(...sources) {
  const values = new Array(sources.length);
  let called = 0;
  let pendingCall = null;
  const allCalled = Math.pow(2, sources.length) - 1;
  sources.forEach((source, index) => {
    const bit = Math.pow(2, index);
    subscribe(source, (value) => {
      const prevCalled = called;
      called = called | bit;
      values[index] = value;
      if (prevCalled !== allCalled && called === allCalled && pendingCall) {
        pendingCall();
        pendingCall = null;
      }
    });
  });
  return (done) => (value) => {
    const call2 = () => done([value].concat(values));
    if (called === allCalled) {
      call2();
    } else {
      pendingCall = call2;
    }
  };
}
function merge(...sources) {
  return function(action, subscription) {
    switch (action) {
      case SUBSCRIBE:
        return joinProc(...sources.map((source) => subscribe(source, subscription)));
      case RESET:
        return;
      default:
        throw new Error(`unrecognized action ${action}`);
    }
  };
}
function duc(source, comparator = defaultComparator) {
  return pipe(source, distinctUntilChanged(comparator));
}
function combineLatest(...emitters) {
  const innerSubject = stream();
  const values = new Array(emitters.length);
  let called = 0;
  const allCalled = Math.pow(2, emitters.length) - 1;
  emitters.forEach((source, index) => {
    const bit = Math.pow(2, index);
    subscribe(source, (value) => {
      values[index] = value;
      called = called | bit;
      if (called === allCalled) {
        publish(innerSubject, values);
      }
    });
  });
  return function(action, subscription) {
    switch (action) {
      case SUBSCRIBE:
        if (called === allCalled) {
          subscription(values);
        }
        return subscribe(innerSubject, subscription);
      case RESET:
        return reset(innerSubject);
      default:
        throw new Error(`unrecognized action ${action}`);
    }
  };
}
function system(constructor, dependencies = [], { singleton } = { singleton: true }) {
  return {
    id: id(),
    constructor,
    dependencies,
    singleton
  };
}
const id = () => Symbol();
function init(systemSpec) {
  const singletons = /* @__PURE__ */ new Map();
  const _init = ({ id: id2, constructor, dependencies, singleton }) => {
    if (singleton && singletons.has(id2)) {
      return singletons.get(id2);
    }
    const system2 = constructor(dependencies.map((e) => _init(e)));
    if (singleton) {
      singletons.set(id2, system2);
    }
    return system2;
  };
  return _init(systemSpec);
}
function omit(keys, obj) {
  const result = {};
  const index = {};
  let idx = 0;
  const len = keys.length;
  while (idx < len) {
    index[keys[idx]] = 1;
    idx += 1;
  }
  for (const prop in obj) {
    if (!index.hasOwnProperty(prop)) {
      result[prop] = obj[prop];
    }
  }
  return result;
}
const useIsomorphicLayoutEffect$1 = typeof document !== "undefined" ? React.useLayoutEffect : React.useEffect;
function systemToComponent(systemSpec, map2, Root) {
  const requiredPropNames = Object.keys(map2.required || {});
  const optionalPropNames = Object.keys(map2.optional || {});
  const methodNames = Object.keys(map2.methods || {});
  const eventNames = Object.keys(map2.events || {});
  const Context = React.createContext({});
  function applyPropsToSystem(system2, props) {
    if (system2["propsReady"]) {
      publish(system2["propsReady"], false);
    }
    for (const requiredPropName of requiredPropNames) {
      const stream2 = system2[map2.required[requiredPropName]];
      publish(stream2, props[requiredPropName]);
    }
    for (const optionalPropName of optionalPropNames) {
      if (optionalPropName in props) {
        const stream2 = system2[map2.optional[optionalPropName]];
        publish(stream2, props[optionalPropName]);
      }
    }
    if (system2["propsReady"]) {
      publish(system2["propsReady"], true);
    }
  }
  function buildMethods(system2) {
    return methodNames.reduce((acc, methodName) => {
      acc[methodName] = (value) => {
        const stream2 = system2[map2.methods[methodName]];
        publish(stream2, value);
      };
      return acc;
    }, {});
  }
  function buildEventHandlers(system2) {
    return eventNames.reduce((handlers, eventName) => {
      handlers[eventName] = eventHandler(system2[map2.events[eventName]]);
      return handlers;
    }, {});
  }
  const Component = React.forwardRef((propsWithChildren, ref) => {
    const { children, ...props } = propsWithChildren;
    const [system2] = React.useState(() => {
      return tap(init(systemSpec), (system22) => applyPropsToSystem(system22, props));
    });
    const [handlers] = React.useState(curry1to0(buildEventHandlers, system2));
    useIsomorphicLayoutEffect$1(() => {
      for (const eventName of eventNames) {
        if (eventName in props) {
          subscribe(handlers[eventName], props[eventName]);
        }
      }
      return () => {
        Object.values(handlers).map(reset);
      };
    }, [props, handlers, system2]);
    useIsomorphicLayoutEffect$1(() => {
      applyPropsToSystem(system2, props);
    });
    React.useImperativeHandle(ref, always(buildMethods(system2)));
    const RootComponent = Root;
    return /* @__PURE__ */ jsx(Context.Provider, { value: system2, children: Root ? /* @__PURE__ */ jsx(RootComponent, { ...omit([...requiredPropNames, ...optionalPropNames, ...eventNames], props), children }) : children });
  });
  const usePublisher2 = (key) => {
    return React.useCallback(curry2to1(publish, React.useContext(Context)[key]), [key]);
  };
  const useEmitterValue18 = (key) => {
    const system2 = React.useContext(Context);
    const source = system2[key];
    const cb = React.useCallback(
      (c) => {
        return subscribe(source, c);
      },
      [source]
    );
    return React.useSyncExternalStore(
      cb,
      () => getValue(source),
      () => getValue(source)
    );
  };
  const useEmitterValueLegacy = (key) => {
    const system2 = React.useContext(Context);
    const source = system2[key];
    const [value, setValue] = React.useState(curry1to0(getValue, source));
    useIsomorphicLayoutEffect$1(
      () => subscribe(source, (next) => {
        if (next !== value) {
          setValue(always(next));
        }
      }),
      [source, value]
    );
    return value;
  };
  const useEmitterValue2 = React.version.startsWith("18") ? useEmitterValue18 : useEmitterValueLegacy;
  const useEmitter2 = (key, callback) => {
    const context = React.useContext(Context);
    const source = context[key];
    useIsomorphicLayoutEffect$1(() => subscribe(source, callback), [callback, source]);
  };
  return {
    Component,
    usePublisher: usePublisher2,
    useEmitterValue: useEmitterValue2,
    useEmitter: useEmitter2
  };
}
const useIsomorphicLayoutEffect = typeof document !== "undefined" ? React.useLayoutEffect : React.useEffect;
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
const CONSOLE_METHOD_MAP = {
  [
    0
    /* DEBUG */
  ]: "debug",
  [
    1
    /* INFO */
  ]: "log",
  [
    2
    /* WARN */
  ]: "warn",
  [
    3
    /* ERROR */
  ]: "error"
};
const getGlobalThis = () => typeof globalThis === "undefined" ? window : globalThis;
const loggerSystem = system(
  () => {
    const logLevel = statefulStream(
      3
      /* ERROR */
    );
    const log = statefulStream((label, message, level = 1) => {
      var _a;
      const currentLevel = (_a = getGlobalThis()["VIRTUOSO_LOG_LEVEL"]) != null ? _a : getValue(logLevel);
      if (level >= currentLevel) {
        console[CONSOLE_METHOD_MAP[level]](
          "%creact-virtuoso: %c%s %o",
          "color: #0253b3; font-weight: bold",
          "color: initial",
          label,
          message
        );
      }
    });
    return {
      log,
      logLevel
    };
  },
  [],
  { singleton: true }
);
function useSizeWithElRef(callback, enabled, skipAnimationFrame) {
  const ref = React.useRef(null);
  let callbackRef = (_el) => {
  };
  if (typeof ResizeObserver !== "undefined") {
    const observer = React.useMemo(() => {
      return new ResizeObserver((entries) => {
        const code = () => {
          const element = entries[0].target;
          if (element.offsetParent !== null) {
            callback(element);
          }
        };
        skipAnimationFrame ? code() : requestAnimationFrame(code);
      });
    }, [callback]);
    callbackRef = (elRef) => {
      if (elRef && enabled) {
        observer.observe(elRef);
        ref.current = elRef;
      } else {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
        ref.current = null;
      }
    };
  }
  return { ref, callbackRef };
}
function useSize(callback, enabled, skipAnimationFrame) {
  return useSizeWithElRef(callback, enabled, skipAnimationFrame).callbackRef;
}
function useChangedListContentsSizes(callback, itemSize, enabled, scrollContainerStateCallback, log, gap, customScrollParent, horizontalDirection, skipAnimationFrame) {
  const memoedCallback = React.useCallback(
    (el) => {
      const ranges = getChangedChildSizes(el.children, itemSize, horizontalDirection ? "offsetWidth" : "offsetHeight", log);
      let scrollableElement = el.parentElement;
      while (!scrollableElement.dataset["virtuosoScroller"]) {
        scrollableElement = scrollableElement.parentElement;
      }
      const windowScrolling = scrollableElement.lastElementChild.dataset["viewportType"] === "window";
      const scrollTop = customScrollParent ? horizontalDirection ? customScrollParent.scrollLeft : customScrollParent.scrollTop : windowScrolling ? horizontalDirection ? window.pageXOffset || document.documentElement.scrollLeft : window.pageYOffset || document.documentElement.scrollTop : horizontalDirection ? scrollableElement.scrollLeft : scrollableElement.scrollTop;
      const scrollHeight = customScrollParent ? horizontalDirection ? customScrollParent.scrollWidth : customScrollParent.scrollHeight : windowScrolling ? horizontalDirection ? document.documentElement.scrollWidth : document.documentElement.scrollHeight : horizontalDirection ? scrollableElement.scrollWidth : scrollableElement.scrollHeight;
      const viewportHeight = customScrollParent ? horizontalDirection ? customScrollParent.offsetWidth : customScrollParent.offsetHeight : windowScrolling ? horizontalDirection ? window.innerWidth : window.innerHeight : horizontalDirection ? scrollableElement.offsetWidth : scrollableElement.offsetHeight;
      scrollContainerStateCallback({
        scrollTop: Math.max(scrollTop, 0),
        scrollHeight,
        viewportHeight
      });
      gap == null ? void 0 : gap(
        horizontalDirection ? resolveGapValue$1("column-gap", getComputedStyle(el).columnGap, log) : resolveGapValue$1("row-gap", getComputedStyle(el).rowGap, log)
      );
      if (ranges !== null) {
        callback(ranges);
      }
    },
    [callback, itemSize, log, gap, customScrollParent, scrollContainerStateCallback]
  );
  return useSizeWithElRef(memoedCallback, enabled, skipAnimationFrame);
}
function getChangedChildSizes(children, itemSize, field, log) {
  const length = children.length;
  if (length === 0) {
    return null;
  }
  const results = [];
  for (let i = 0; i < length; i++) {
    const child = children.item(i);
    if (!child || child.dataset.index === void 0) {
      continue;
    }
    const index = parseInt(child.dataset.index);
    const knownSize = parseFloat(child.dataset.knownSize);
    const size = itemSize(child, field);
    if (size === 0) {
      log("Zero-sized element, this should not happen", { child }, LogLevel.ERROR);
    }
    if (size === knownSize) {
      continue;
    }
    const lastResult = results[results.length - 1];
    if (results.length === 0 || lastResult.size !== size || lastResult.endIndex !== index - 1) {
      results.push({ startIndex: index, endIndex: index, size });
    } else {
      results[results.length - 1].endIndex++;
    }
  }
  return results;
}
function resolveGapValue$1(property, value, log) {
  if (value !== "normal" && !(value == null ? void 0 : value.endsWith("px"))) {
    log(`${property} was not resolved to pixel value correctly`, value, LogLevel.WARN);
  }
  if (value === "normal") {
    return 0;
  }
  return parseInt(value != null ? value : "0", 10);
}
function correctItemSize(el, dimension) {
  return Math.round(el.getBoundingClientRect()[dimension]);
}
function approximatelyEqual(num1, num2) {
  return Math.abs(num1 - num2) < 1.01;
}
function useScrollTop(scrollContainerStateCallback, smoothScrollTargetReached, scrollerElement, scrollerRefCallback = noop, customScrollParent, horizontalDirection) {
  const scrollerRef = React.useRef(null);
  const scrollTopTarget = React.useRef(null);
  const timeoutRef = React.useRef(null);
  const handler = React.useCallback(
    (ev) => {
      const el = ev.target;
      const windowScroll = el === window || el === document;
      const scrollTop = horizontalDirection ? windowScroll ? window.pageXOffset || document.documentElement.scrollLeft : el.scrollLeft : windowScroll ? window.pageYOffset || document.documentElement.scrollTop : el.scrollTop;
      const scrollHeight = horizontalDirection ? windowScroll ? document.documentElement.scrollWidth : el.scrollWidth : windowScroll ? document.documentElement.scrollHeight : el.scrollHeight;
      const viewportHeight = horizontalDirection ? windowScroll ? window.innerWidth : el.offsetWidth : windowScroll ? window.innerHeight : el.offsetHeight;
      const call2 = () => {
        scrollContainerStateCallback({
          scrollTop: Math.max(scrollTop, 0),
          scrollHeight,
          viewportHeight
        });
      };
      if (ev.suppressFlushSync) {
        call2();
      } else {
        ReactDOM.flushSync(call2);
      }
      if (scrollTopTarget.current !== null) {
        if (scrollTop === scrollTopTarget.current || scrollTop <= 0 || scrollTop === scrollHeight - viewportHeight) {
          scrollTopTarget.current = null;
          smoothScrollTargetReached(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      }
    },
    [scrollContainerStateCallback, smoothScrollTargetReached]
  );
  React.useEffect(() => {
    const localRef = customScrollParent ? customScrollParent : scrollerRef.current;
    scrollerRefCallback(customScrollParent ? customScrollParent : scrollerRef.current);
    handler({ target: localRef, suppressFlushSync: true });
    localRef.addEventListener("scroll", handler, { passive: true });
    return () => {
      scrollerRefCallback(null);
      localRef.removeEventListener("scroll", handler);
    };
  }, [scrollerRef, handler, scrollerElement, scrollerRefCallback, customScrollParent]);
  function scrollToCallback(location) {
    const scrollerElement2 = scrollerRef.current;
    if (!scrollerElement2 || (horizontalDirection ? "offsetWidth" in scrollerElement2 && scrollerElement2.offsetWidth === 0 : "offsetHeight" in scrollerElement2 && scrollerElement2.offsetHeight === 0)) {
      return;
    }
    const isSmooth = location.behavior === "smooth";
    let offsetHeight;
    let scrollHeight;
    let scrollTop;
    if (scrollerElement2 === window) {
      scrollHeight = Math.max(
        correctItemSize(document.documentElement, horizontalDirection ? "width" : "height"),
        horizontalDirection ? document.documentElement.scrollWidth : document.documentElement.scrollHeight
      );
      offsetHeight = horizontalDirection ? window.innerWidth : window.innerHeight;
      scrollTop = horizontalDirection ? document.documentElement.scrollLeft : document.documentElement.scrollTop;
    } else {
      scrollHeight = scrollerElement2[horizontalDirection ? "scrollWidth" : "scrollHeight"];
      offsetHeight = correctItemSize(scrollerElement2, horizontalDirection ? "width" : "height");
      scrollTop = scrollerElement2[horizontalDirection ? "scrollLeft" : "scrollTop"];
    }
    const maxScrollTop = scrollHeight - offsetHeight;
    location.top = Math.ceil(Math.max(Math.min(maxScrollTop, location.top), 0));
    if (approximatelyEqual(offsetHeight, scrollHeight) || location.top === scrollTop) {
      scrollContainerStateCallback({ scrollTop, scrollHeight, viewportHeight: offsetHeight });
      if (isSmooth) {
        smoothScrollTargetReached(true);
      }
      return;
    }
    if (isSmooth) {
      scrollTopTarget.current = location.top;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        scrollTopTarget.current = null;
        smoothScrollTargetReached(true);
      }, 1e3);
    } else {
      scrollTopTarget.current = null;
    }
    if (horizontalDirection) {
      location = { left: location.top, behavior: location.behavior };
    }
    scrollerElement2.scrollTo(location);
  }
  function scrollByCallback(location) {
    if (horizontalDirection) {
      location = { left: location.top, behavior: location.behavior };
    }
    scrollerRef.current.scrollBy(location);
  }
  return { scrollerRef, scrollByCallback, scrollToCallback };
}
const domIOSystem = system(
  () => {
    const scrollContainerState = stream();
    const scrollTop = stream();
    const deviation = statefulStream(0);
    const smoothScrollTargetReached = stream();
    const statefulScrollTop = statefulStream(0);
    const viewportHeight = stream();
    const scrollHeight = stream();
    const headerHeight = statefulStream(0);
    const fixedHeaderHeight = statefulStream(0);
    const fixedFooterHeight = statefulStream(0);
    const footerHeight = statefulStream(0);
    const scrollTo = stream();
    const scrollBy = stream();
    const scrollingInProgress = statefulStream(false);
    const horizontalDirection = statefulStream(false);
    const skipAnimationFrameInResizeObserver = statefulStream(false);
    connect(
      pipe(
        scrollContainerState,
        map(({ scrollTop: scrollTop2 }) => scrollTop2)
      ),
      scrollTop
    );
    connect(
      pipe(
        scrollContainerState,
        map(({ scrollHeight: scrollHeight2 }) => scrollHeight2)
      ),
      scrollHeight
    );
    connect(scrollTop, statefulScrollTop);
    return {
      // input
      scrollContainerState,
      scrollTop,
      viewportHeight,
      headerHeight,
      fixedHeaderHeight,
      fixedFooterHeight,
      footerHeight,
      scrollHeight,
      smoothScrollTargetReached,
      horizontalDirection,
      skipAnimationFrameInResizeObserver,
      // signals
      scrollTo,
      scrollBy,
      // state
      statefulScrollTop,
      deviation,
      scrollingInProgress
    };
  },
  [],
  { singleton: true }
);
const NIL_NODE = { lvl: 0 };
function newAANode(k, v, lvl, l = NIL_NODE, r = NIL_NODE) {
  return { k, v, lvl, l, r };
}
function empty(node) {
  return node === NIL_NODE;
}
function newTree() {
  return NIL_NODE;
}
function remove(node, key) {
  if (empty(node)) return NIL_NODE;
  const { k, l, r } = node;
  if (key === k) {
    if (empty(l)) {
      return r;
    } else if (empty(r)) {
      return l;
    } else {
      const [lastKey, lastValue] = last(l);
      return adjust(clone(node, { k: lastKey, v: lastValue, l: deleteLast(l) }));
    }
  } else if (key < k) {
    return adjust(clone(node, { l: remove(l, key) }));
  } else {
    return adjust(clone(node, { r: remove(r, key) }));
  }
}
function find(node, key) {
  if (empty(node)) {
    return;
  }
  if (key === node.k) {
    return node.v;
  } else if (key < node.k) {
    return find(node.l, key);
  } else {
    return find(node.r, key);
  }
}
function findMaxKeyValue(node, value, field = "k") {
  if (empty(node)) {
    return [-Infinity, void 0];
  }
  if (Number(node[field]) === value) {
    return [node.k, node.v];
  }
  if (Number(node[field]) < value) {
    const r = findMaxKeyValue(node.r, value, field);
    if (r[0] === -Infinity) {
      return [node.k, node.v];
    } else {
      return r;
    }
  }
  return findMaxKeyValue(node.l, value, field);
}
function insert(node, k, v) {
  if (empty(node)) {
    return newAANode(k, v, 1);
  }
  if (k === node.k) {
    return clone(node, { k, v });
  } else if (k < node.k) {
    return rebalance(clone(node, { l: insert(node.l, k, v) }));
  } else {
    return rebalance(clone(node, { r: insert(node.r, k, v) }));
  }
}
function walkWithin(node, start, end) {
  if (empty(node)) {
    return [];
  }
  const { k, v, l, r } = node;
  let result = [];
  if (k > start) {
    result = result.concat(walkWithin(l, start, end));
  }
  if (k >= start && k <= end) {
    result.push({ k, v });
  }
  if (k <= end) {
    result = result.concat(walkWithin(r, start, end));
  }
  return result;
}
function walk(node) {
  if (empty(node)) {
    return [];
  }
  return [...walk(node.l), { k: node.k, v: node.v }, ...walk(node.r)];
}
function last(node) {
  return empty(node.r) ? [node.k, node.v] : last(node.r);
}
function deleteLast(node) {
  return empty(node.r) ? node.l : adjust(clone(node, { r: deleteLast(node.r) }));
}
function clone(node, args) {
  return newAANode(
    args.k !== void 0 ? args.k : node.k,
    args.v !== void 0 ? args.v : node.v,
    args.lvl !== void 0 ? args.lvl : node.lvl,
    args.l !== void 0 ? args.l : node.l,
    args.r !== void 0 ? args.r : node.r
  );
}
function isSingle(node) {
  return empty(node) || node.lvl > node.r.lvl;
}
function rebalance(node) {
  return split(skew(node));
}
function adjust(node) {
  const { l, r, lvl } = node;
  if (r.lvl >= lvl - 1 && l.lvl >= lvl - 1) {
    return node;
  } else if (lvl > r.lvl + 1) {
    if (isSingle(l)) {
      return skew(clone(node, { lvl: lvl - 1 }));
    } else {
      if (!empty(l) && !empty(l.r)) {
        return clone(l.r, {
          l: clone(l, { r: l.r.l }),
          r: clone(node, {
            l: l.r.r,
            lvl: lvl - 1
          }),
          lvl
        });
      } else {
        throw new Error("Unexpected empty nodes");
      }
    }
  } else {
    if (isSingle(node)) {
      return split(clone(node, { lvl: lvl - 1 }));
    } else {
      if (!empty(r) && !empty(r.l)) {
        const rl = r.l;
        const rlvl = isSingle(rl) ? r.lvl - 1 : r.lvl;
        return clone(rl, {
          l: clone(node, {
            r: rl.l,
            lvl: lvl - 1
          }),
          r: split(clone(r, { l: rl.r, lvl: rlvl })),
          lvl: rl.lvl + 1
        });
      } else {
        throw new Error("Unexpected empty nodes");
      }
    }
  }
}
function rangesWithin(node, startIndex, endIndex) {
  if (empty(node)) {
    return [];
  }
  const adjustedStart = findMaxKeyValue(node, startIndex)[0];
  return toRanges(walkWithin(node, adjustedStart, endIndex));
}
function arrayToRanges(items, parser) {
  const length = items.length;
  if (length === 0) {
    return [];
  }
  let { index: start, value } = parser(items[0]);
  const result = [];
  for (let i = 1; i < length; i++) {
    const { index: nextIndex, value: nextValue } = parser(items[i]);
    result.push({ start, end: nextIndex - 1, value });
    start = nextIndex;
    value = nextValue;
  }
  result.push({ start, end: Infinity, value });
  return result;
}
function toRanges(nodes) {
  return arrayToRanges(nodes, ({ k: index, v: value }) => ({ index, value }));
}
function split(node) {
  const { r, lvl } = node;
  return !empty(r) && !empty(r.r) && r.lvl === lvl && r.r.lvl === lvl ? clone(r, { l: clone(node, { r: r.l }), lvl: lvl + 1 }) : node;
}
function skew(node) {
  const { l } = node;
  return !empty(l) && l.lvl === node.lvl ? clone(l, { r: clone(node, { l: l.r }) }) : node;
}
function findIndexOfClosestSmallerOrEqual(items, value, comparator, start = 0) {
  let end = items.length - 1;
  while (start <= end) {
    const index = Math.floor((start + end) / 2);
    const item = items[index];
    const match = comparator(item, value);
    if (match === 0) {
      return index;
    }
    if (match === -1) {
      if (end - start < 2) {
        return index - 1;
      }
      end = index - 1;
    } else {
      if (end === start) {
        return index;
      }
      start = index + 1;
    }
  }
  throw new Error(`Failed binary finding record in array - ${items.join(",")}, searched for ${value}`);
}
function findClosestSmallerOrEqual(items, value, comparator) {
  return items[findIndexOfClosestSmallerOrEqual(items, value, comparator)];
}
function findRange(items, startValue, endValue, comparator) {
  const startIndex = findIndexOfClosestSmallerOrEqual(items, startValue, comparator);
  const endIndex = findIndexOfClosestSmallerOrEqual(items, endValue, comparator, startIndex);
  return items.slice(startIndex, endIndex + 1);
}
const recalcSystem = system(
  () => {
    const recalcInProgress = statefulStream(false);
    return { recalcInProgress };
  },
  [],
  { singleton: true }
);
function rangeIncludes(refRange) {
  const { size, startIndex, endIndex } = refRange;
  return (range) => {
    return range.start === startIndex && (range.end === endIndex || range.end === Infinity) && range.value === size;
  };
}
function affectedGroupCount(offset, groupIndices) {
  let recognizedOffsetItems = 0;
  let groupIndex = 0;
  while (recognizedOffsetItems < offset) {
    recognizedOffsetItems += groupIndices[groupIndex + 1] - groupIndices[groupIndex] - 1;
    groupIndex++;
  }
  const offsetIsExact = recognizedOffsetItems === offset;
  return groupIndex - (offsetIsExact ? 0 : 1);
}
function insertRanges(sizeTree, ranges) {
  let syncStart = empty(sizeTree) ? 0 : Infinity;
  for (const range of ranges) {
    const { size, startIndex, endIndex } = range;
    syncStart = Math.min(syncStart, startIndex);
    if (empty(sizeTree)) {
      sizeTree = insert(sizeTree, 0, size);
      continue;
    }
    const overlappingRanges = rangesWithin(sizeTree, startIndex - 1, endIndex + 1);
    if (overlappingRanges.some(rangeIncludes(range))) {
      continue;
    }
    let firstPassDone = false;
    let shouldInsert = false;
    for (const { start: rangeStart, end: rangeEnd, value: rangeValue } of overlappingRanges) {
      if (!firstPassDone) {
        shouldInsert = rangeValue !== size;
        firstPassDone = true;
      } else {
        if (endIndex >= rangeStart || size === rangeValue) {
          sizeTree = remove(sizeTree, rangeStart);
        }
      }
      if (rangeEnd > endIndex && endIndex >= rangeStart) {
        if (rangeValue !== size) {
          sizeTree = insert(sizeTree, endIndex + 1, rangeValue);
        }
      }
    }
    if (shouldInsert) {
      sizeTree = insert(sizeTree, startIndex, size);
    }
  }
  return [sizeTree, syncStart];
}
function initialSizeState() {
  return {
    offsetTree: [],
    sizeTree: newTree(),
    groupOffsetTree: newTree(),
    lastIndex: 0,
    lastOffset: 0,
    lastSize: 0,
    groupIndices: []
  };
}
function indexComparator({ index: itemIndex }, index) {
  return index === itemIndex ? 0 : index < itemIndex ? -1 : 1;
}
function offsetComparator({ offset: itemOffset }, offset) {
  return offset === itemOffset ? 0 : offset < itemOffset ? -1 : 1;
}
function offsetPointParser(point) {
  return { index: point.index, value: point };
}
function rangesWithinOffsets(tree, startOffset, endOffset, minStartIndex = 0) {
  if (minStartIndex > 0) {
    startOffset = Math.max(startOffset, findClosestSmallerOrEqual(tree, minStartIndex, indexComparator).offset);
  }
  return arrayToRanges(findRange(tree, startOffset, endOffset, offsetComparator), offsetPointParser);
}
function createOffsetTree(prevOffsetTree, syncStart, sizeTree, gap) {
  let offsetTree = prevOffsetTree;
  let prevIndex = 0;
  let prevSize = 0;
  let prevOffset = 0;
  let startIndex = 0;
  if (syncStart !== 0) {
    startIndex = findIndexOfClosestSmallerOrEqual(offsetTree, syncStart - 1, indexComparator);
    const offsetInfo = offsetTree[startIndex];
    prevOffset = offsetInfo.offset;
    const kv = findMaxKeyValue(sizeTree, syncStart - 1);
    prevIndex = kv[0];
    prevSize = kv[1];
    if (offsetTree.length && offsetTree[startIndex].size === findMaxKeyValue(sizeTree, syncStart)[1]) {
      startIndex -= 1;
    }
    offsetTree = offsetTree.slice(0, startIndex + 1);
  } else {
    offsetTree = [];
  }
  for (const { start: startIndex2, value } of rangesWithin(sizeTree, syncStart, Infinity)) {
    const indexOffset = startIndex2 - prevIndex;
    const aOffset = indexOffset * prevSize + prevOffset + indexOffset * gap;
    offsetTree.push({
      offset: aOffset,
      size: value,
      index: startIndex2
    });
    prevIndex = startIndex2;
    prevOffset = aOffset;
    prevSize = value;
  }
  return {
    offsetTree,
    lastIndex: prevIndex,
    lastOffset: prevOffset,
    lastSize: prevSize
  };
}
function sizeStateReducer(state, [ranges, groupIndices, log, gap]) {
  if (ranges.length > 0) {
    log("received item sizes", ranges, LogLevel.DEBUG);
  }
  const sizeTree = state.sizeTree;
  let newSizeTree = sizeTree;
  let syncStart = 0;
  if (groupIndices.length > 0 && empty(sizeTree) && ranges.length === 2) {
    const groupSize = ranges[0].size;
    const itemSize = ranges[1].size;
    newSizeTree = groupIndices.reduce((tree, groupIndex) => {
      return insert(insert(tree, groupIndex, groupSize), groupIndex + 1, itemSize);
    }, newSizeTree);
  } else {
    [newSizeTree, syncStart] = insertRanges(newSizeTree, ranges);
  }
  if (newSizeTree === sizeTree) {
    return state;
  }
  const { offsetTree: newOffsetTree, lastIndex, lastSize, lastOffset } = createOffsetTree(state.offsetTree, syncStart, newSizeTree, gap);
  return {
    sizeTree: newSizeTree,
    offsetTree: newOffsetTree,
    lastIndex,
    lastOffset,
    lastSize,
    groupOffsetTree: groupIndices.reduce((tree, index) => {
      return insert(tree, index, offsetOf(index, newOffsetTree, gap));
    }, newTree()),
    groupIndices
  };
}
function offsetOf(index, tree, gap) {
  if (tree.length === 0) {
    return 0;
  }
  const { offset, index: startIndex, size } = findClosestSmallerOrEqual(tree, index, indexComparator);
  const itemCount = index - startIndex;
  const top = size * itemCount + (itemCount - 1) * gap + offset;
  return top > 0 ? top + gap : top;
}
function isGroupLocation(location) {
  return typeof location.groupIndex !== "undefined";
}
function originalIndexFromLocation(location, sizes, lastIndex) {
  if (isGroupLocation(location)) {
    return sizes.groupIndices[location.groupIndex] + 1;
  } else {
    const numericIndex = location.index === "LAST" ? lastIndex : location.index;
    let result = originalIndexFromItemIndex(numericIndex, sizes);
    result = Math.max(0, result, Math.min(lastIndex, result));
    return result;
  }
}
function originalIndexFromItemIndex(itemIndex, sizes) {
  if (!hasGroups(sizes)) {
    return itemIndex;
  }
  let groupOffset = 0;
  while (sizes.groupIndices[groupOffset] <= itemIndex + groupOffset) {
    groupOffset++;
  }
  return itemIndex + groupOffset;
}
function hasGroups(sizes) {
  return !empty(sizes.groupOffsetTree);
}
function sizeTreeToRanges(sizeTree) {
  return walk(sizeTree).map(({ k: startIndex, v: size }, index, sizeArray) => {
    const nextSize = sizeArray[index + 1];
    const endIndex = nextSize ? nextSize.k - 1 : Infinity;
    return { startIndex, endIndex, size };
  });
}
const SIZE_MAP = {
  offsetHeight: "height",
  offsetWidth: "width"
};
const sizeSystem = system(
  ([{ log }, { recalcInProgress }]) => {
    const sizeRanges = stream();
    const totalCount = stream();
    const statefulTotalCount = statefulStreamFromEmitter(totalCount, 0);
    const unshiftWith = stream();
    const shiftWith = stream();
    const firstItemIndex = statefulStream(0);
    const groupIndices = statefulStream([]);
    const fixedItemSize = statefulStream(void 0);
    const defaultItemSize = statefulStream(void 0);
    const itemSize = statefulStream((el, field) => correctItemSize(el, SIZE_MAP[field]));
    const data = statefulStream(void 0);
    const gap = statefulStream(0);
    const initial = initialSizeState();
    const sizes = statefulStreamFromEmitter(
      pipe(sizeRanges, withLatestFrom(groupIndices, log, gap), scan(sizeStateReducer, initial), distinctUntilChanged()),
      initial
    );
    const prevGroupIndices = statefulStreamFromEmitter(
      pipe(
        groupIndices,
        distinctUntilChanged(),
        scan((prev, curr) => ({ prev: prev.current, current: curr }), {
          prev: [],
          current: []
        }),
        map(({ prev }) => prev)
      ),
      []
    );
    connect(
      pipe(
        groupIndices,
        filter((indexes) => indexes.length > 0),
        withLatestFrom(sizes, gap),
        map(([groupIndices2, sizes2, gap2]) => {
          const groupOffsetTree = groupIndices2.reduce((tree, index, idx) => {
            return insert(tree, index, offsetOf(index, sizes2.offsetTree, gap2) || idx);
          }, newTree());
          return {
            ...sizes2,
            groupIndices: groupIndices2,
            groupOffsetTree
          };
        })
      ),
      sizes
    );
    connect(
      pipe(
        totalCount,
        withLatestFrom(sizes),
        filter(([totalCount2, { lastIndex }]) => {
          return totalCount2 < lastIndex;
        }),
        map(([totalCount2, { lastIndex, lastSize }]) => {
          return [
            {
              startIndex: totalCount2,
              endIndex: lastIndex,
              size: lastSize
            }
          ];
        })
      ),
      sizeRanges
    );
    connect(fixedItemSize, defaultItemSize);
    const trackItemSizes = statefulStreamFromEmitter(
      pipe(
        fixedItemSize,
        map((size) => size === void 0)
      ),
      true
    );
    connect(
      pipe(
        defaultItemSize,
        filter((value) => {
          return value !== void 0 && empty(getValue(sizes).sizeTree);
        }),
        map((size) => [{ startIndex: 0, endIndex: 0, size }])
      ),
      sizeRanges
    );
    const listRefresh = streamFromEmitter(
      pipe(
        sizeRanges,
        withLatestFrom(sizes),
        scan(
          ({ sizes: oldSizes }, [_, newSizes]) => {
            return {
              changed: newSizes !== oldSizes,
              sizes: newSizes
            };
          },
          { changed: false, sizes: initial }
        ),
        map((value) => value.changed)
      )
    );
    subscribe(
      pipe(
        firstItemIndex,
        scan(
          (prev, next) => {
            return { diff: prev.prev - next, prev: next };
          },
          { diff: 0, prev: 0 }
        ),
        map((val) => val.diff)
      ),
      (offset) => {
        const { groupIndices: groupIndices2 } = getValue(sizes);
        if (offset > 0) {
          publish(recalcInProgress, true);
          publish(unshiftWith, offset + affectedGroupCount(offset, groupIndices2));
        } else if (offset < 0) {
          const prevGroupIndicesValue = getValue(prevGroupIndices);
          if (prevGroupIndicesValue.length > 0) {
            offset -= affectedGroupCount(-offset, prevGroupIndicesValue);
          }
          publish(shiftWith, offset);
        }
      }
    );
    subscribe(pipe(firstItemIndex, withLatestFrom(log)), ([index, log2]) => {
      if (index < 0) {
        log2(
          "`firstItemIndex` prop should not be set to less than zero. If you don't know the total count, just use a very high value",
          { firstItemIndex },
          LogLevel.ERROR
        );
      }
    });
    const beforeUnshiftWith = streamFromEmitter(unshiftWith);
    connect(
      pipe(
        unshiftWith,
        withLatestFrom(sizes),
        map(([unshiftWith2, sizes2]) => {
          const groupedMode = sizes2.groupIndices.length > 0;
          const initialRanges = [];
          const defaultSize = sizes2.lastSize;
          if (groupedMode) {
            const firstGroupSize = find(sizes2.sizeTree, 0);
            let prependedGroupItemsCount = 0;
            let groupIndex = 0;
            while (prependedGroupItemsCount < unshiftWith2) {
              const theGroupIndex = sizes2.groupIndices[groupIndex];
              const groupItemCount = sizes2.groupIndices.length === groupIndex + 1 ? Infinity : sizes2.groupIndices[groupIndex + 1] - theGroupIndex - 1;
              initialRanges.push({
                startIndex: theGroupIndex,
                endIndex: theGroupIndex,
                size: firstGroupSize
              });
              initialRanges.push({
                startIndex: theGroupIndex + 1,
                endIndex: theGroupIndex + 1 + groupItemCount - 1,
                size: defaultSize
              });
              groupIndex++;
              prependedGroupItemsCount += groupItemCount + 1;
            }
            const sizeTreeKV = walk(sizes2.sizeTree);
            const firstGroupIsExpanded = prependedGroupItemsCount !== unshiftWith2;
            if (firstGroupIsExpanded) {
              sizeTreeKV.shift();
            }
            return sizeTreeKV.reduce(
              (acc, { k: index, v: size }) => {
                let ranges = acc.ranges;
                if (acc.prevSize !== 0) {
                  ranges = [
                    ...acc.ranges,
                    {
                      startIndex: acc.prevIndex,
                      endIndex: index + unshiftWith2 - 1,
                      size: acc.prevSize
                    }
                  ];
                }
                return {
                  ranges,
                  prevIndex: index + unshiftWith2,
                  prevSize: size
                };
              },
              {
                ranges: initialRanges,
                prevIndex: unshiftWith2,
                prevSize: 0
              }
            ).ranges;
          }
          return walk(sizes2.sizeTree).reduce(
            (acc, { k: index, v: size }) => {
              return {
                ranges: [...acc.ranges, { startIndex: acc.prevIndex, endIndex: index + unshiftWith2 - 1, size: acc.prevSize }],
                prevIndex: index + unshiftWith2,
                prevSize: size
              };
            },
            {
              ranges: [],
              prevIndex: 0,
              prevSize: defaultSize
            }
          ).ranges;
        })
      ),
      sizeRanges
    );
    const shiftWithOffset = streamFromEmitter(
      pipe(
        shiftWith,
        withLatestFrom(sizes, gap),
        map(([shiftWith2, { offsetTree }, gap2]) => {
          const newFirstItemIndex = -shiftWith2;
          return offsetOf(newFirstItemIndex, offsetTree, gap2);
        })
      )
    );
    connect(
      pipe(
        shiftWith,
        withLatestFrom(sizes, gap),
        map(([shiftWith2, sizes2, gap2]) => {
          const groupedMode = sizes2.groupIndices.length > 0;
          if (groupedMode) {
            if (empty(sizes2.sizeTree)) {
              return sizes2;
            }
            let newSizeTree = newTree();
            const prevGroupIndicesValue = getValue(prevGroupIndices);
            let removedItemsCount = 0;
            let groupIndex = 0;
            let groupOffset = 0;
            while (removedItemsCount < -shiftWith2) {
              groupOffset = prevGroupIndicesValue[groupIndex];
              const groupItemCount = prevGroupIndicesValue[groupIndex + 1] - groupOffset - 1;
              groupIndex++;
              removedItemsCount += groupItemCount + 1;
            }
            newSizeTree = walk(sizes2.sizeTree).reduce((acc, { k, v }) => {
              return insert(acc, Math.max(0, k + shiftWith2), v);
            }, newSizeTree);
            const aGroupIsShrunk = removedItemsCount !== -shiftWith2;
            if (aGroupIsShrunk) {
              const firstGroupSize = find(sizes2.sizeTree, groupOffset);
              newSizeTree = insert(newSizeTree, 0, firstGroupSize);
              const nextItemSize = findMaxKeyValue(sizes2.sizeTree, -shiftWith2 + 1)[1];
              newSizeTree = insert(newSizeTree, 1, nextItemSize);
            }
            return {
              ...sizes2,
              sizeTree: newSizeTree,
              ...createOffsetTree(sizes2.offsetTree, 0, newSizeTree, gap2)
            };
          } else {
            const newSizeTree = walk(sizes2.sizeTree).reduce((acc, { k, v }) => {
              return insert(acc, Math.max(0, k + shiftWith2), v);
            }, newTree());
            return {
              ...sizes2,
              sizeTree: newSizeTree,
              ...createOffsetTree(sizes2.offsetTree, 0, newSizeTree, gap2)
            };
          }
        })
      ),
      sizes
    );
    return {
      // input
      data,
      totalCount,
      sizeRanges,
      groupIndices,
      defaultItemSize,
      fixedItemSize,
      unshiftWith,
      shiftWith,
      shiftWithOffset,
      beforeUnshiftWith,
      firstItemIndex,
      gap,
      // output
      sizes,
      listRefresh,
      statefulTotalCount,
      trackItemSizes,
      itemSize
    };
  },
  tup(loggerSystem, recalcSystem),
  { singleton: true }
);
const SUPPORTS_SCROLL_TO_OPTIONS = typeof document !== "undefined" && "scrollBehavior" in document.documentElement.style;
function normalizeIndexLocation(location) {
  const result = typeof location === "number" ? { index: location } : location;
  if (!result.align) {
    result.align = "start";
  }
  if (!result.behavior || !SUPPORTS_SCROLL_TO_OPTIONS) {
    result.behavior = "auto";
  }
  if (!result.offset) {
    result.offset = 0;
  }
  return result;
}
const scrollToIndexSystem = system(
  ([
    { sizes, totalCount, listRefresh, gap },
    {
      scrollingInProgress,
      viewportHeight,
      scrollTo,
      smoothScrollTargetReached,
      headerHeight,
      footerHeight,
      fixedHeaderHeight,
      fixedFooterHeight
    },
    { log }
  ]) => {
    const scrollToIndex = stream();
    const scrollTargetReached = stream();
    const topListHeight = statefulStream(0);
    let unsubscribeNextListRefresh = null;
    let cleartTimeoutRef = null;
    let unsubscribeListRefresh = null;
    function cleanup() {
      if (unsubscribeNextListRefresh) {
        unsubscribeNextListRefresh();
        unsubscribeNextListRefresh = null;
      }
      if (unsubscribeListRefresh) {
        unsubscribeListRefresh();
        unsubscribeListRefresh = null;
      }
      if (cleartTimeoutRef) {
        clearTimeout(cleartTimeoutRef);
        cleartTimeoutRef = null;
      }
      publish(scrollingInProgress, false);
    }
    connect(
      pipe(
        scrollToIndex,
        withLatestFrom(sizes, viewportHeight, totalCount, topListHeight, headerHeight, footerHeight, log),
        withLatestFrom(gap, fixedHeaderHeight, fixedFooterHeight),
        map(
          ([
            [location, sizes2, viewportHeight2, totalCount2, topListHeight2, headerHeight2, footerHeight2, log2],
            gap2,
            fixedHeaderHeight2,
            fixedFooterHeight2
          ]) => {
            const normalLocation = normalizeIndexLocation(location);
            const { align, behavior, offset } = normalLocation;
            const lastIndex = totalCount2 - 1;
            const index = originalIndexFromLocation(normalLocation, sizes2, lastIndex);
            let top = offsetOf(index, sizes2.offsetTree, gap2) + headerHeight2;
            if (align === "end") {
              top += fixedHeaderHeight2 + findMaxKeyValue(sizes2.sizeTree, index)[1] - viewportHeight2 + fixedFooterHeight2;
              if (index === lastIndex) {
                top += footerHeight2;
              }
            } else if (align === "center") {
              top += (fixedHeaderHeight2 + findMaxKeyValue(sizes2.sizeTree, index)[1] - viewportHeight2 + fixedFooterHeight2) / 2;
            } else {
              top -= topListHeight2;
            }
            if (offset) {
              top += offset;
            }
            const retry = (listChanged) => {
              cleanup();
              if (listChanged) {
                log2("retrying to scroll to", { location }, LogLevel.DEBUG);
                publish(scrollToIndex, location);
              } else {
                publish(scrollTargetReached, true);
                log2("list did not change, scroll successful", {}, LogLevel.DEBUG);
              }
            };
            cleanup();
            if (behavior === "smooth") {
              let listChanged = false;
              unsubscribeListRefresh = subscribe(listRefresh, (changed) => {
                listChanged = listChanged || changed;
              });
              unsubscribeNextListRefresh = handleNext(smoothScrollTargetReached, () => {
                retry(listChanged);
              });
            } else {
              unsubscribeNextListRefresh = handleNext(pipe(listRefresh, watchChangesFor(150)), retry);
            }
            cleartTimeoutRef = setTimeout(() => {
              cleanup();
            }, 1200);
            publish(scrollingInProgress, true);
            log2("scrolling from index to", { index, top, behavior }, LogLevel.DEBUG);
            return { top, behavior };
          }
        )
      ),
      scrollTo
    );
    return {
      scrollToIndex,
      scrollTargetReached,
      topListHeight
    };
  },
  tup(sizeSystem, domIOSystem, loggerSystem),
  { singleton: true }
);
function watchChangesFor(limit) {
  return (done) => {
    const timeoutRef = setTimeout(() => {
      done(false);
    }, limit);
    return (value) => {
      if (value) {
        done(true);
        clearTimeout(timeoutRef);
      }
    };
  };
}
const UP = "up";
const DOWN = "down";
const NONE$1 = "none";
const INITIAL_BOTTOM_STATE = {
  atBottom: false,
  notAtBottomBecause: "NOT_SHOWING_LAST_ITEM",
  state: {
    offsetBottom: 0,
    scrollTop: 0,
    viewportHeight: 0,
    scrollHeight: 0
  }
};
const DEFAULT_AT_TOP_THRESHOLD = 0;
const stateFlagsSystem = system(([{ scrollContainerState, scrollTop, viewportHeight, headerHeight, footerHeight, scrollBy }]) => {
  const isAtBottom = statefulStream(false);
  const isAtTop = statefulStream(true);
  const atBottomStateChange = stream();
  const atTopStateChange = stream();
  const atBottomThreshold = statefulStream(4);
  const atTopThreshold = statefulStream(DEFAULT_AT_TOP_THRESHOLD);
  const isScrolling = statefulStreamFromEmitter(
    pipe(
      merge(pipe(duc(scrollTop), skip(1), mapTo(true)), pipe(duc(scrollTop), skip(1), mapTo(false), debounceTime(100))),
      distinctUntilChanged()
    ),
    false
  );
  const isScrollingBy = statefulStreamFromEmitter(
    pipe(merge(pipe(scrollBy, mapTo(true)), pipe(scrollBy, mapTo(false), debounceTime(200))), distinctUntilChanged()),
    false
  );
  connect(
    pipe(
      combineLatest(duc(scrollTop), duc(atTopThreshold)),
      map(([top, atTopThreshold2]) => top <= atTopThreshold2),
      distinctUntilChanged()
    ),
    isAtTop
  );
  connect(pipe(isAtTop, throttleTime(50)), atTopStateChange);
  const atBottomState = streamFromEmitter(
    pipe(
      combineLatest(scrollContainerState, duc(viewportHeight), duc(headerHeight), duc(footerHeight), duc(atBottomThreshold)),
      scan((current, [{ scrollTop: scrollTop2, scrollHeight }, viewportHeight2, _headerHeight, _footerHeight, atBottomThreshold2]) => {
        const isAtBottom2 = scrollTop2 + viewportHeight2 - scrollHeight > -atBottomThreshold2;
        const state = {
          viewportHeight: viewportHeight2,
          scrollTop: scrollTop2,
          scrollHeight
        };
        if (isAtBottom2) {
          let atBottomBecause;
          let scrollTopDelta;
          if (scrollTop2 > current.state.scrollTop) {
            atBottomBecause = "SCROLLED_DOWN";
            scrollTopDelta = current.state.scrollTop - scrollTop2;
          } else {
            atBottomBecause = "SIZE_DECREASED";
            scrollTopDelta = current.state.scrollTop - scrollTop2 || current.scrollTopDelta;
          }
          return {
            atBottom: true,
            state,
            atBottomBecause,
            scrollTopDelta
          };
        }
        let notAtBottomBecause;
        if (state.scrollHeight > current.state.scrollHeight) {
          notAtBottomBecause = "SIZE_INCREASED";
        } else if (viewportHeight2 < current.state.viewportHeight) {
          notAtBottomBecause = "VIEWPORT_HEIGHT_DECREASING";
        } else if (scrollTop2 < current.state.scrollTop) {
          notAtBottomBecause = "SCROLLING_UPWARDS";
        } else {
          notAtBottomBecause = "NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM";
        }
        return {
          atBottom: false,
          notAtBottomBecause,
          state
        };
      }, INITIAL_BOTTOM_STATE),
      distinctUntilChanged((prev, next) => {
        return prev && prev.atBottom === next.atBottom;
      })
    )
  );
  const lastJumpDueToItemResize = statefulStreamFromEmitter(
    pipe(
      scrollContainerState,
      scan(
        (current, { scrollTop: scrollTop2, scrollHeight, viewportHeight: viewportHeight2 }) => {
          if (!approximatelyEqual(current.scrollHeight, scrollHeight)) {
            const atBottom = scrollHeight - (scrollTop2 + viewportHeight2) < 1;
            if (current.scrollTop !== scrollTop2 && atBottom) {
              return {
                scrollHeight,
                scrollTop: scrollTop2,
                jump: current.scrollTop - scrollTop2,
                changed: true
              };
            } else {
              return {
                scrollHeight,
                scrollTop: scrollTop2,
                jump: 0,
                changed: true
              };
            }
          } else {
            return {
              scrollTop: scrollTop2,
              scrollHeight,
              jump: 0,
              changed: false
            };
          }
        },
        { scrollHeight: 0, jump: 0, scrollTop: 0, changed: false }
      ),
      filter((value) => value.changed),
      map((value) => value.jump)
    ),
    0
  );
  connect(
    pipe(
      atBottomState,
      map((state) => state.atBottom)
    ),
    isAtBottom
  );
  connect(pipe(isAtBottom, throttleTime(50)), atBottomStateChange);
  const scrollDirection = statefulStream(DOWN);
  connect(
    pipe(
      scrollContainerState,
      map(({ scrollTop: scrollTop2 }) => scrollTop2),
      distinctUntilChanged(),
      scan(
        (acc, scrollTop2) => {
          if (getValue(isScrollingBy)) {
            return { direction: acc.direction, prevScrollTop: scrollTop2 };
          }
          return { direction: scrollTop2 < acc.prevScrollTop ? UP : DOWN, prevScrollTop: scrollTop2 };
        },
        { direction: DOWN, prevScrollTop: 0 }
      ),
      map((value) => value.direction)
    ),
    scrollDirection
  );
  connect(pipe(scrollContainerState, throttleTime(50), mapTo(NONE$1)), scrollDirection);
  const scrollVelocity = statefulStream(0);
  connect(
    pipe(
      isScrolling,
      filter((value) => !value),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mapTo(0)
    ),
    scrollVelocity
  );
  connect(
    pipe(
      scrollTop,
      throttleTime(100),
      withLatestFrom(isScrolling),
      filter(([_, isScrolling2]) => !!isScrolling2),
      scan(([_, prev], [next]) => [prev, next], [0, 0]),
      map(([prev, next]) => next - prev)
    ),
    scrollVelocity
  );
  return {
    isScrolling,
    isAtTop,
    isAtBottom,
    atBottomState,
    atTopStateChange,
    atBottomStateChange,
    scrollDirection,
    atBottomThreshold,
    atTopThreshold,
    scrollVelocity,
    lastJumpDueToItemResize
  };
}, tup(domIOSystem));
const propsReadySystem = system(
  ([{ log }]) => {
    const propsReady = statefulStream(false);
    const didMount = streamFromEmitter(
      pipe(
        propsReady,
        filter((ready) => ready),
        distinctUntilChanged()
      )
    );
    subscribe(propsReady, (value) => {
      value && getValue(log)("props updated", {}, LogLevel.DEBUG);
    });
    return { propsReady, didMount };
  },
  tup(loggerSystem),
  { singleton: true }
);
function skipFrames(frameCount, callback) {
  if (frameCount == 0) {
    callback();
  } else {
    requestAnimationFrame(() => skipFrames(frameCount - 1, callback));
  }
}
function getInitialTopMostItemIndexNumber(location, totalCount) {
  const lastIndex = totalCount - 1;
  const index = typeof location === "number" ? location : location.index === "LAST" ? lastIndex : location.index;
  return index;
}
const initialTopMostItemIndexSystem = system(
  ([{ sizes, listRefresh, defaultItemSize }, { scrollTop }, { scrollToIndex, scrollTargetReached }, { didMount }]) => {
    const scrolledToInitialItem = statefulStream(true);
    const initialTopMostItemIndex = statefulStream(0);
    const initialItemFinalLocationReached = statefulStream(true);
    connect(
      pipe(
        didMount,
        withLatestFrom(initialTopMostItemIndex),
        filter(([_, location]) => !!location),
        mapTo(false)
      ),
      scrolledToInitialItem
    );
    connect(
      pipe(
        didMount,
        withLatestFrom(initialTopMostItemIndex),
        filter(([_, location]) => !!location),
        mapTo(false)
      ),
      initialItemFinalLocationReached
    );
    subscribe(
      pipe(
        combineLatest(listRefresh, didMount),
        withLatestFrom(scrolledToInitialItem, sizes, defaultItemSize, initialItemFinalLocationReached),
        filter(([[, didMount2], scrolledToInitialItem2, { sizeTree }, defaultItemSize2, scrollScheduled]) => {
          return didMount2 && (!empty(sizeTree) || isDefined(defaultItemSize2)) && !scrolledToInitialItem2 && !scrollScheduled;
        }),
        withLatestFrom(initialTopMostItemIndex)
      ),
      ([, initialTopMostItemIndex2]) => {
        handleNext(scrollTargetReached, () => {
          publish(initialItemFinalLocationReached, true);
        });
        skipFrames(4, () => {
          handleNext(scrollTop, () => {
            publish(scrolledToInitialItem, true);
          });
          publish(scrollToIndex, initialTopMostItemIndex2);
        });
      }
    );
    return {
      scrolledToInitialItem,
      initialTopMostItemIndex,
      initialItemFinalLocationReached
    };
  },
  tup(sizeSystem, domIOSystem, scrollToIndexSystem, propsReadySystem),
  { singleton: true }
);
function normalizeFollowOutput(follow) {
  if (!follow) {
    return false;
  }
  return follow === "smooth" ? "smooth" : "auto";
}
const behaviorFromFollowOutput = (follow, isAtBottom) => {
  if (typeof follow === "function") {
    return normalizeFollowOutput(follow(isAtBottom));
  }
  return isAtBottom && normalizeFollowOutput(follow);
};
const followOutputSystem = system(
  ([
    { totalCount, listRefresh },
    { isAtBottom, atBottomState },
    { scrollToIndex },
    { scrolledToInitialItem },
    { propsReady, didMount },
    { log },
    { scrollingInProgress }
  ]) => {
    const followOutput = statefulStream(false);
    const autoscrollToBottom = stream();
    let pendingScrollHandle = null;
    function scrollToBottom(followOutputBehavior) {
      publish(scrollToIndex, {
        index: "LAST",
        align: "end",
        behavior: followOutputBehavior
      });
    }
    subscribe(
      pipe(
        combineLatest(pipe(duc(totalCount), skip(1)), didMount),
        withLatestFrom(duc(followOutput), isAtBottom, scrolledToInitialItem, scrollingInProgress),
        map(([[totalCount2, didMount2], followOutput2, isAtBottom2, scrolledToInitialItem2, scrollingInProgress2]) => {
          let shouldFollow = didMount2 && scrolledToInitialItem2;
          let followOutputBehavior = "auto";
          if (shouldFollow) {
            followOutputBehavior = behaviorFromFollowOutput(followOutput2, isAtBottom2 || scrollingInProgress2);
            shouldFollow = shouldFollow && !!followOutputBehavior;
          }
          return { totalCount: totalCount2, shouldFollow, followOutputBehavior };
        }),
        filter(({ shouldFollow }) => shouldFollow)
      ),
      ({ totalCount: totalCount2, followOutputBehavior }) => {
        if (pendingScrollHandle) {
          pendingScrollHandle();
          pendingScrollHandle = null;
        }
        pendingScrollHandle = handleNext(listRefresh, () => {
          getValue(log)("following output to ", { totalCount: totalCount2 }, LogLevel.DEBUG);
          scrollToBottom(followOutputBehavior);
          pendingScrollHandle = null;
        });
      }
    );
    function trapNextSizeIncrease(followOutput2) {
      const cancel = handleNext(atBottomState, (state) => {
        if (followOutput2 && !state.atBottom && state.notAtBottomBecause === "SIZE_INCREASED" && !pendingScrollHandle) {
          getValue(log)("scrolling to bottom due to increased size", {}, LogLevel.DEBUG);
          scrollToBottom("auto");
        }
      });
      setTimeout(cancel, 100);
    }
    subscribe(
      pipe(
        combineLatest(duc(followOutput), totalCount, propsReady),
        filter(([follow, , ready]) => follow && ready),
        scan(
          ({ value }, [, next]) => {
            return { refreshed: value === next, value: next };
          },
          { refreshed: false, value: 0 }
        ),
        filter(({ refreshed }) => refreshed),
        withLatestFrom(followOutput, totalCount)
      ),
      ([, followOutput2]) => {
        if (getValue(scrolledToInitialItem)) {
          trapNextSizeIncrease(followOutput2 !== false);
        }
      }
    );
    subscribe(autoscrollToBottom, () => {
      trapNextSizeIncrease(getValue(followOutput) !== false);
    });
    subscribe(combineLatest(duc(followOutput), atBottomState), ([followOutput2, state]) => {
      if (followOutput2 && !state.atBottom && state.notAtBottomBecause === "VIEWPORT_HEIGHT_DECREASING") {
        scrollToBottom("auto");
      }
    });
    return { followOutput, autoscrollToBottom };
  },
  tup(sizeSystem, stateFlagsSystem, scrollToIndexSystem, initialTopMostItemIndexSystem, propsReadySystem, loggerSystem, domIOSystem)
);
function groupCountsToIndicesAndCount(counts) {
  return counts.reduce(
    (acc, groupCount) => {
      acc.groupIndices.push(acc.totalCount);
      acc.totalCount += groupCount + 1;
      return acc;
    },
    {
      totalCount: 0,
      groupIndices: []
    }
  );
}
const groupedListSystem = system(([{ totalCount, groupIndices, sizes }, { scrollTop, headerHeight }]) => {
  const groupCounts = stream();
  const topItemsIndexes = stream();
  const groupIndicesAndCount = streamFromEmitter(pipe(groupCounts, map(groupCountsToIndicesAndCount)));
  connect(
    pipe(
      groupIndicesAndCount,
      map((value) => value.totalCount)
    ),
    totalCount
  );
  connect(
    pipe(
      groupIndicesAndCount,
      map((value) => value.groupIndices)
    ),
    groupIndices
  );
  connect(
    pipe(
      combineLatest(scrollTop, sizes, headerHeight),
      filter(([_, sizes2]) => hasGroups(sizes2)),
      map(([scrollTop2, state, headerHeight2]) => findMaxKeyValue(state.groupOffsetTree, Math.max(scrollTop2 - headerHeight2, 0), "v")[0]),
      distinctUntilChanged(),
      map((index) => [index])
    ),
    topItemsIndexes
  );
  return { groupCounts, topItemsIndexes };
}, tup(sizeSystem, domIOSystem));
function tupleComparator(prev, current) {
  return !!(prev && prev[0] === current[0] && prev[1] === current[1]);
}
function rangeComparator(prev, next) {
  return !!(prev && prev.startIndex === next.startIndex && prev.endIndex === next.endIndex);
}
const TOP = "top";
const BOTTOM = "bottom";
const NONE = "none";
function getOverscan(overscan, end, direction) {
  if (typeof overscan === "number") {
    return direction === UP && end === TOP || direction === DOWN && end === BOTTOM ? overscan : 0;
  } else {
    if (direction === UP) {
      return end === TOP ? overscan.main : overscan.reverse;
    } else {
      return end === BOTTOM ? overscan.main : overscan.reverse;
    }
  }
}
function getViewportIncrease(value, end) {
  return typeof value === "number" ? value : value[end] || 0;
}
const sizeRangeSystem = system(
  ([{ scrollTop, viewportHeight, deviation, headerHeight, fixedHeaderHeight }]) => {
    const listBoundary = stream();
    const topListHeight = statefulStream(0);
    const increaseViewportBy = statefulStream(0);
    const overscan = statefulStream(0);
    const visibleRange = statefulStreamFromEmitter(
      pipe(
        combineLatest(
          duc(scrollTop),
          duc(viewportHeight),
          duc(headerHeight),
          duc(listBoundary, tupleComparator),
          duc(overscan),
          duc(topListHeight),
          duc(fixedHeaderHeight),
          duc(deviation),
          duc(increaseViewportBy)
        ),
        map(
          ([
            scrollTop2,
            viewportHeight2,
            headerHeight2,
            [listTop, listBottom],
            overscan2,
            topListHeight2,
            fixedHeaderHeight2,
            deviation2,
            increaseViewportBy2
          ]) => {
            const top = scrollTop2 - deviation2;
            const stickyHeaderHeight = topListHeight2 + fixedHeaderHeight2;
            const headerVisible = Math.max(headerHeight2 - top, 0);
            let direction = NONE;
            const topViewportAddition = getViewportIncrease(increaseViewportBy2, TOP);
            const bottomViewportAddition = getViewportIncrease(increaseViewportBy2, BOTTOM);
            listTop -= deviation2;
            listTop += headerHeight2 + fixedHeaderHeight2;
            listBottom += headerHeight2 + fixedHeaderHeight2;
            listBottom -= deviation2;
            if (listTop > scrollTop2 + stickyHeaderHeight - topViewportAddition) {
              direction = UP;
            }
            if (listBottom < scrollTop2 - headerVisible + viewportHeight2 + bottomViewportAddition) {
              direction = DOWN;
            }
            if (direction !== NONE) {
              return [
                Math.max(top - headerHeight2 - getOverscan(overscan2, TOP, direction) - topViewportAddition, 0),
                top - headerVisible - fixedHeaderHeight2 + viewportHeight2 + getOverscan(overscan2, BOTTOM, direction) + bottomViewportAddition
              ];
            }
            return null;
          }
        ),
        filter((value) => value != null),
        distinctUntilChanged(tupleComparator)
      ),
      [0, 0]
    );
    return {
      // input
      listBoundary,
      overscan,
      topListHeight,
      increaseViewportBy,
      // output
      visibleRange
    };
  },
  tup(domIOSystem),
  { singleton: true }
);
function probeItemSet(index, sizes, data) {
  if (hasGroups(sizes)) {
    const itemIndex = originalIndexFromItemIndex(index, sizes);
    const groupIndex = findMaxKeyValue(sizes.groupOffsetTree, itemIndex)[0];
    return [
      { index: groupIndex, size: 0, offset: 0 },
      { index: itemIndex, size: 0, offset: 0, data: data && data[0] }
    ];
  }
  return [{ index, size: 0, offset: 0, data: data && data[0] }];
}
const EMPTY_LIST_STATE = {
  items: [],
  topItems: [],
  offsetTop: 0,
  offsetBottom: 0,
  top: 0,
  bottom: 0,
  topListHeight: 0,
  totalCount: 0,
  firstItemIndex: 0
};
function transposeItems(items, sizes, firstItemIndex) {
  if (items.length === 0) {
    return [];
  }
  if (!hasGroups(sizes)) {
    return items.map((item) => ({ ...item, index: item.index + firstItemIndex, originalIndex: item.index }));
  }
  const startIndex = items[0].index;
  const endIndex = items[items.length - 1].index;
  const transposedItems = [];
  const groupRanges = rangesWithin(sizes.groupOffsetTree, startIndex, endIndex);
  let currentRange = void 0;
  let currentGroupIndex = 0;
  for (const item of items) {
    if (!currentRange || currentRange.end < item.index) {
      currentRange = groupRanges.shift();
      currentGroupIndex = sizes.groupIndices.indexOf(currentRange.start);
    }
    let transposedItem;
    if (item.index === currentRange.start) {
      transposedItem = {
        type: "group",
        index: currentGroupIndex
      };
    } else {
      transposedItem = {
        index: item.index - (currentGroupIndex + 1) + firstItemIndex,
        groupIndex: currentGroupIndex
      };
    }
    transposedItems.push({
      ...transposedItem,
      size: item.size,
      offset: item.offset,
      originalIndex: item.index,
      data: item.data
    });
  }
  return transposedItems;
}
function buildListState(items, topItems, totalCount, gap, sizes, firstItemIndex) {
  const { lastSize, lastOffset, lastIndex } = sizes;
  let offsetTop = 0;
  let bottom = 0;
  if (items.length > 0) {
    offsetTop = items[0].offset;
    const lastItem = items[items.length - 1];
    bottom = lastItem.offset + lastItem.size;
  }
  const itemCount = totalCount - lastIndex;
  const total = lastOffset + itemCount * lastSize + (itemCount - 1) * gap;
  const top = offsetTop;
  const offsetBottom = total - bottom;
  return {
    items: transposeItems(items, sizes, firstItemIndex),
    topItems: transposeItems(topItems, sizes, firstItemIndex),
    topListHeight: topItems.reduce((height, item) => item.size + height, 0),
    offsetTop,
    offsetBottom,
    top,
    bottom,
    totalCount,
    firstItemIndex
  };
}
function buildListStateFromItemCount(itemCount, initialTopMostItemIndex, sizes, firstItemIndex, gap, data) {
  let includedGroupsCount = 0;
  if (sizes.groupIndices.length > 0) {
    for (const index of sizes.groupIndices) {
      if (index - includedGroupsCount >= itemCount) {
        break;
      }
      includedGroupsCount++;
    }
  }
  const adjustedCount = itemCount + includedGroupsCount;
  const initialTopMostItemIndexNumber = getInitialTopMostItemIndexNumber(initialTopMostItemIndex, adjustedCount);
  const items = Array.from({ length: adjustedCount }).map((_, index) => ({
    index: index + initialTopMostItemIndexNumber,
    size: 0,
    offset: 0,
    data: data[index + initialTopMostItemIndexNumber]
  }));
  return buildListState(items, [], adjustedCount, gap, sizes, firstItemIndex);
}
const listStateSystem = system(
  ([
    { sizes, totalCount, data, firstItemIndex, gap },
    groupedListSystem2,
    { visibleRange, listBoundary, topListHeight: rangeTopListHeight },
    { scrolledToInitialItem, initialTopMostItemIndex },
    { topListHeight },
    stateFlags,
    { didMount },
    { recalcInProgress }
  ]) => {
    const topItemsIndexes = statefulStream([]);
    const initialItemCount = statefulStream(0);
    const itemsRendered = stream();
    connect(groupedListSystem2.topItemsIndexes, topItemsIndexes);
    const listState = statefulStreamFromEmitter(
      pipe(
        combineLatest(
          didMount,
          recalcInProgress,
          duc(visibleRange, tupleComparator),
          duc(totalCount),
          duc(sizes),
          duc(initialTopMostItemIndex),
          scrolledToInitialItem,
          duc(topItemsIndexes),
          duc(firstItemIndex),
          duc(gap),
          data
        ),
        filter(([mount, recalcInProgress2, , totalCount2, , , , , , , data2]) => {
          const dataChangeInProgress = data2 && data2.length !== totalCount2;
          return mount && !recalcInProgress2 && !dataChangeInProgress;
        }),
        map(
          ([
            ,
            ,
            [startOffset, endOffset],
            totalCount2,
            sizes2,
            initialTopMostItemIndex2,
            scrolledToInitialItem2,
            topItemsIndexes2,
            firstItemIndex2,
            gap2,
            data2
          ]) => {
            const sizesValue = sizes2;
            const { sizeTree, offsetTree } = sizesValue;
            const initialItemCountValue = getValue(initialItemCount);
            if (totalCount2 === 0) {
              return { ...EMPTY_LIST_STATE, totalCount: totalCount2 };
            }
            if (startOffset === 0 && endOffset === 0) {
              if (initialItemCountValue === 0) {
                return { ...EMPTY_LIST_STATE, totalCount: totalCount2 };
              } else {
                return buildListStateFromItemCount(initialItemCountValue, initialTopMostItemIndex2, sizes2, firstItemIndex2, gap2, data2 || []);
              }
            }
            if (empty(sizeTree)) {
              if (initialItemCountValue > 0) {
                return null;
              }
              const state = buildListState(
                probeItemSet(getInitialTopMostItemIndexNumber(initialTopMostItemIndex2, totalCount2), sizesValue, data2),
                [],
                totalCount2,
                gap2,
                sizesValue,
                firstItemIndex2
              );
              return state;
            }
            const topItems = [];
            if (topItemsIndexes2.length > 0) {
              const startIndex = topItemsIndexes2[0];
              const endIndex = topItemsIndexes2[topItemsIndexes2.length - 1];
              let offset = 0;
              for (const range of rangesWithin(sizeTree, startIndex, endIndex)) {
                const size = range.value;
                const rangeStartIndex = Math.max(range.start, startIndex);
                const rangeEndIndex = Math.min(range.end, endIndex);
                for (let i = rangeStartIndex; i <= rangeEndIndex; i++) {
                  topItems.push({ index: i, size, offset, data: data2 && data2[i] });
                  offset += size;
                }
              }
            }
            if (!scrolledToInitialItem2) {
              return buildListState([], topItems, totalCount2, gap2, sizesValue, firstItemIndex2);
            }
            const minStartIndex = topItemsIndexes2.length > 0 ? topItemsIndexes2[topItemsIndexes2.length - 1] + 1 : 0;
            const offsetPointRanges = rangesWithinOffsets(offsetTree, startOffset, endOffset, minStartIndex);
            if (offsetPointRanges.length === 0) {
              return null;
            }
            const maxIndex = totalCount2 - 1;
            const items = tap([], (result) => {
              for (const range of offsetPointRanges) {
                const point = range.value;
                let offset = point.offset;
                let rangeStartIndex = range.start;
                const size = point.size;
                if (point.offset < startOffset) {
                  rangeStartIndex += Math.floor((startOffset - point.offset + gap2) / (size + gap2));
                  const itemCount = rangeStartIndex - range.start;
                  offset += itemCount * size + itemCount * gap2;
                }
                if (rangeStartIndex < minStartIndex) {
                  offset += (minStartIndex - rangeStartIndex) * size;
                  rangeStartIndex = minStartIndex;
                }
                const endIndex = Math.min(range.end, maxIndex);
                for (let i = rangeStartIndex; i <= endIndex; i++) {
                  if (offset >= endOffset) {
                    break;
                  }
                  result.push({ index: i, size, offset, data: data2 && data2[i] });
                  offset += size + gap2;
                }
              }
            });
            return buildListState(items, topItems, totalCount2, gap2, sizesValue, firstItemIndex2);
          }
        ),
        //@ts-expect-error filter needs to be fixed
        filter((value) => value !== null),
        distinctUntilChanged()
      ),
      EMPTY_LIST_STATE
    );
    connect(
      pipe(
        data,
        filter(isDefined),
        map((data2) => data2 == null ? void 0 : data2.length)
      ),
      totalCount
    );
    connect(
      pipe(
        listState,
        map((value) => value.topListHeight)
      ),
      topListHeight
    );
    connect(topListHeight, rangeTopListHeight);
    connect(
      pipe(
        listState,
        map((state) => [state.top, state.bottom])
      ),
      listBoundary
    );
    connect(
      pipe(
        listState,
        map((state) => state.items)
      ),
      itemsRendered
    );
    const endReached = streamFromEmitter(
      pipe(
        listState,
        filter(({ items }) => items.length > 0),
        withLatestFrom(totalCount, data),
        filter(([{ items }, totalCount2]) => items[items.length - 1].originalIndex === totalCount2 - 1),
        map(([, totalCount2, data2]) => [totalCount2 - 1, data2]),
        distinctUntilChanged(tupleComparator),
        map(([count]) => count)
      )
    );
    const startReached = streamFromEmitter(
      pipe(
        listState,
        throttleTime(200),
        filter(({ items, topItems }) => {
          return items.length > 0 && items[0].originalIndex === topItems.length;
        }),
        map(({ items }) => items[0].index),
        distinctUntilChanged()
      )
    );
    const rangeChanged = streamFromEmitter(
      pipe(
        listState,
        filter(({ items }) => items.length > 0),
        map(({ items }) => {
          let startIndex = 0;
          let endIndex = items.length - 1;
          while (items[startIndex].type === "group" && startIndex < endIndex) {
            startIndex++;
          }
          while (items[endIndex].type === "group" && endIndex > startIndex) {
            endIndex--;
          }
          return {
            startIndex: items[startIndex].index,
            endIndex: items[endIndex].index
          };
        }),
        distinctUntilChanged(rangeComparator)
      )
    );
    return { listState, topItemsIndexes, endReached, startReached, rangeChanged, itemsRendered, initialItemCount, ...stateFlags };
  },
  tup(
    sizeSystem,
    groupedListSystem,
    sizeRangeSystem,
    initialTopMostItemIndexSystem,
    scrollToIndexSystem,
    stateFlagsSystem,
    propsReadySystem,
    recalcSystem
  ),
  { singleton: true }
);
const initialItemCountSystem = system(
  ([{ sizes, firstItemIndex, data, gap }, { initialTopMostItemIndex }, { initialItemCount, listState }, { didMount }]) => {
    connect(
      pipe(
        didMount,
        withLatestFrom(initialItemCount),
        filter(([, count]) => count !== 0),
        withLatestFrom(initialTopMostItemIndex, sizes, firstItemIndex, gap, data),
        map(([[, count], initialTopMostItemIndexValue, sizes2, firstItemIndex2, gap2, data2 = []]) => {
          return buildListStateFromItemCount(count, initialTopMostItemIndexValue, sizes2, firstItemIndex2, gap2, data2);
        })
      ),
      listState
    );
    return {};
  },
  tup(sizeSystem, initialTopMostItemIndexSystem, listStateSystem, propsReadySystem),
  { singleton: true }
);
const scrollSeekSystem = system(
  ([{ scrollVelocity }]) => {
    const isSeeking = statefulStream(false);
    const rangeChanged = stream();
    const scrollSeekConfiguration = statefulStream(false);
    connect(
      pipe(
        scrollVelocity,
        withLatestFrom(scrollSeekConfiguration, isSeeking, rangeChanged),
        filter(([_, config]) => !!config),
        map(([speed, config, isSeeking2, range]) => {
          const { exit, enter } = config;
          if (isSeeking2) {
            if (exit(speed, range)) {
              return false;
            }
          } else {
            if (enter(speed, range)) {
              return true;
            }
          }
          return isSeeking2;
        }),
        distinctUntilChanged()
      ),
      isSeeking
    );
    subscribe(
      pipe(combineLatest(isSeeking, scrollVelocity, rangeChanged), withLatestFrom(scrollSeekConfiguration)),
      ([[isSeeking2, velocity, range], config]) => isSeeking2 && config && config.change && config.change(velocity, range)
    );
    return { isSeeking, scrollSeekConfiguration, scrollVelocity, scrollSeekRangeChanged: rangeChanged };
  },
  tup(stateFlagsSystem),
  { singleton: true }
);
const topItemCountSystem = system(([{ topItemsIndexes }]) => {
  const topItemCount = statefulStream(0);
  connect(
    pipe(
      topItemCount,
      filter((length) => length > 0),
      map((length) => Array.from({ length }).map((_, index) => index))
    ),
    topItemsIndexes
  );
  return { topItemCount };
}, tup(listStateSystem));
const totalListHeightSystem = system(
  ([{ footerHeight, headerHeight, fixedHeaderHeight, fixedFooterHeight }, { listState }]) => {
    const totalListHeightChanged = stream();
    const totalListHeight = statefulStreamFromEmitter(
      pipe(
        combineLatest(footerHeight, fixedFooterHeight, headerHeight, fixedHeaderHeight, listState),
        map(([footerHeight2, fixedFooterHeight2, headerHeight2, fixedHeaderHeight2, listState2]) => {
          return footerHeight2 + fixedFooterHeight2 + headerHeight2 + fixedHeaderHeight2 + listState2.offsetBottom + listState2.bottom;
        })
      ),
      0
    );
    connect(duc(totalListHeight), totalListHeightChanged);
    return { totalListHeight, totalListHeightChanged };
  },
  tup(domIOSystem, listStateSystem),
  { singleton: true }
);
function simpleMemoize(func) {
  let called = false;
  let result;
  return () => {
    if (!called) {
      called = true;
      result = func();
    }
    return result;
  };
}
const isMobileSafari = simpleMemoize(() => {
  return /iP(ad|od|hone)/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent);
});
const upwardScrollFixSystem = system(
  ([
    { scrollBy, scrollTop, deviation, scrollingInProgress },
    { isScrolling, isAtBottom, scrollDirection, lastJumpDueToItemResize },
    { listState },
    { beforeUnshiftWith, shiftWithOffset, sizes, gap },
    { log },
    { recalcInProgress }
  ]) => {
    const deviationOffset = streamFromEmitter(
      pipe(
        listState,
        withLatestFrom(lastJumpDueToItemResize),
        scan(
          ([, prevItems, prevTotalCount, prevTotalHeight], [{ items, totalCount, bottom, offsetBottom }, lastJumpDueToItemResize2]) => {
            const totalHeight = bottom + offsetBottom;
            let newDev = 0;
            if (prevTotalCount === totalCount) {
              if (prevItems.length > 0 && items.length > 0) {
                const atStart = items[0].originalIndex === 0 && prevItems[0].originalIndex === 0;
                if (!atStart) {
                  newDev = totalHeight - prevTotalHeight;
                  if (newDev !== 0) {
                    newDev += lastJumpDueToItemResize2;
                  }
                }
              }
            }
            return [newDev, items, totalCount, totalHeight];
          },
          [0, [], 0, 0]
        ),
        filter(([amount]) => amount !== 0),
        withLatestFrom(scrollTop, scrollDirection, scrollingInProgress, isAtBottom, log, recalcInProgress),
        filter(([, scrollTop2, scrollDirection2, scrollingInProgress2, , , recalcInProgress2]) => {
          return !recalcInProgress2 && !scrollingInProgress2 && scrollTop2 !== 0 && scrollDirection2 === UP;
        }),
        map(([[amount], , , , , log2]) => {
          log2("Upward scrolling compensation", { amount }, LogLevel.DEBUG);
          return amount;
        })
      )
    );
    function scrollByWith(offset) {
      if (offset > 0) {
        publish(scrollBy, { top: -offset, behavior: "auto" });
        publish(deviation, 0);
      } else {
        publish(deviation, 0);
        publish(scrollBy, { top: -offset, behavior: "auto" });
      }
    }
    subscribe(pipe(deviationOffset, withLatestFrom(deviation, isScrolling)), ([offset, deviationAmount, isScrolling2]) => {
      if (isScrolling2 && isMobileSafari()) {
        publish(deviation, deviationAmount - offset);
      } else {
        scrollByWith(-offset);
      }
    });
    subscribe(
      pipe(
        combineLatest(statefulStreamFromEmitter(isScrolling, false), deviation, recalcInProgress),
        filter(([is, deviation2, recalc]) => !is && !recalc && deviation2 !== 0),
        map(([_, deviation2]) => deviation2),
        throttleTime(1)
      ),
      scrollByWith
    );
    connect(
      pipe(
        shiftWithOffset,
        map((offset) => {
          return { top: -offset };
        })
      ),
      scrollBy
    );
    subscribe(
      pipe(
        beforeUnshiftWith,
        withLatestFrom(sizes, gap),
        map(([offset, { lastSize: defaultItemSize, groupIndices, sizeTree }, gap2]) => {
          function getItemOffset(itemCount) {
            return itemCount * (defaultItemSize + gap2);
          }
          if (groupIndices.length === 0) {
            return getItemOffset(offset);
          } else {
            let amount = 0;
            const defaultGroupSize = find(sizeTree, 0);
            let recognizedOffsetItems = 0;
            let groupIndex = 0;
            while (recognizedOffsetItems < offset) {
              recognizedOffsetItems++;
              amount += defaultGroupSize;
              let groupItemCount = groupIndices.length === groupIndex + 1 ? Infinity : groupIndices[groupIndex + 1] - groupIndices[groupIndex] - 1;
              if (recognizedOffsetItems + groupItemCount > offset) {
                amount -= defaultGroupSize;
                groupItemCount = offset - recognizedOffsetItems + 1;
              }
              recognizedOffsetItems += groupItemCount;
              amount += getItemOffset(groupItemCount);
              groupIndex++;
            }
            return amount;
          }
        })
      ),
      (offset) => {
        publish(deviation, offset);
        requestAnimationFrame(() => {
          publish(scrollBy, { top: offset });
          requestAnimationFrame(() => {
            publish(deviation, 0);
            publish(recalcInProgress, false);
          });
        });
      }
    );
    return { deviation };
  },
  tup(domIOSystem, stateFlagsSystem, listStateSystem, sizeSystem, loggerSystem, recalcSystem)
);
const initialScrollTopSystem = system(
  ([{ didMount }, { scrollTo }, { listState }]) => {
    const initialScrollTop = statefulStream(0);
    subscribe(
      pipe(
        didMount,
        withLatestFrom(initialScrollTop),
        filter(([, offset]) => offset !== 0),
        map(([, offset]) => ({ top: offset }))
      ),
      (location) => {
        handleNext(
          pipe(
            listState,
            skip(1),
            filter((state) => state.items.length > 1)
          ),
          () => {
            requestAnimationFrame(() => {
              publish(scrollTo, location);
            });
          }
        );
      }
    );
    return {
      initialScrollTop
    };
  },
  tup(propsReadySystem, domIOSystem, listStateSystem),
  { singleton: true }
);
const alignToBottomSystem = system(
  ([{ viewportHeight }, { totalListHeight }]) => {
    const alignToBottom = statefulStream(false);
    const paddingTopAddition = statefulStreamFromEmitter(
      pipe(
        combineLatest(alignToBottom, viewportHeight, totalListHeight),
        filter(([enabled]) => enabled),
        map(([, viewportHeight2, totalListHeight2]) => {
          return Math.max(0, viewportHeight2 - totalListHeight2);
        }),
        throttleTime(0),
        distinctUntilChanged()
      ),
      0
    );
    return { alignToBottom, paddingTopAddition };
  },
  tup(domIOSystem, totalListHeightSystem),
  { singleton: true }
);
const windowScrollerSystem = system(([{ scrollTo, scrollContainerState }]) => {
  const windowScrollContainerState = stream();
  const windowViewportRect = stream();
  const windowScrollTo = stream();
  const useWindowScroll = statefulStream(false);
  const customScrollParent = statefulStream(void 0);
  connect(
    pipe(
      combineLatest(windowScrollContainerState, windowViewportRect),
      map(([{ viewportHeight, scrollTop: windowScrollTop, scrollHeight }, { offsetTop }]) => {
        return {
          scrollTop: Math.max(0, windowScrollTop - offsetTop),
          scrollHeight,
          viewportHeight
        };
      })
    ),
    scrollContainerState
  );
  connect(
    pipe(
      scrollTo,
      withLatestFrom(windowViewportRect),
      map(([scrollTo2, { offsetTop }]) => {
        return {
          ...scrollTo2,
          top: scrollTo2.top + offsetTop
        };
      })
    ),
    windowScrollTo
  );
  return {
    // config
    useWindowScroll,
    customScrollParent,
    // input
    windowScrollContainerState,
    windowViewportRect,
    // signals
    windowScrollTo
  };
}, tup(domIOSystem));
const defaultCalculateViewLocation = ({
  itemTop: itemTop2,
  itemBottom,
  viewportTop,
  viewportBottom,
  locationParams: { behavior, align, ...rest }
}) => {
  if (itemTop2 < viewportTop) {
    return { ...rest, behavior, align: align != null ? align : "start" };
  }
  if (itemBottom > viewportBottom) {
    return { ...rest, behavior, align: align != null ? align : "end" };
  }
  return null;
};
const scrollIntoViewSystem = system(
  ([
    { sizes, totalCount, gap },
    { scrollTop, viewportHeight, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollingInProgress },
    { scrollToIndex }
  ]) => {
    const scrollIntoView = stream();
    connect(
      pipe(
        scrollIntoView,
        withLatestFrom(sizes, viewportHeight, totalCount, headerHeight, fixedHeaderHeight, fixedFooterHeight, scrollTop),
        withLatestFrom(gap),
        map(([[viewLocation, sizes2, viewportHeight2, totalCount2, headerHeight2, fixedHeaderHeight2, fixedFooterHeight2, scrollTop2], gap2]) => {
          const { done, behavior, align, calculateViewLocation = defaultCalculateViewLocation, ...rest } = viewLocation;
          const actualIndex = originalIndexFromLocation(viewLocation, sizes2, totalCount2 - 1);
          const itemTop2 = offsetOf(actualIndex, sizes2.offsetTree, gap2) + headerHeight2 + fixedHeaderHeight2;
          const itemBottom = itemTop2 + findMaxKeyValue(sizes2.sizeTree, actualIndex)[1];
          const viewportTop = scrollTop2 + fixedHeaderHeight2;
          const viewportBottom = scrollTop2 + viewportHeight2 - fixedFooterHeight2;
          const location = calculateViewLocation({
            itemTop: itemTop2,
            itemBottom,
            viewportTop,
            viewportBottom,
            locationParams: { behavior, align, ...rest }
          });
          if (location) {
            done && handleNext(
              pipe(
                scrollingInProgress,
                filter((value) => value === false),
                // skips the initial publish of false, and the cleanup call.
                // but if scrollingInProgress is true, we skip the initial publish.
                skip(getValue(scrollingInProgress) ? 1 : 2)
              ),
              done
            );
          } else {
            done && done();
          }
          return location;
        }),
        filter((value) => value !== null)
      ),
      scrollToIndex
    );
    return {
      scrollIntoView
    };
  },
  tup(sizeSystem, domIOSystem, scrollToIndexSystem, listStateSystem, loggerSystem),
  { singleton: true }
);
const stateLoadSystem = system(
  ([
    { sizes, sizeRanges },
    { scrollTop, headerHeight },
    { initialTopMostItemIndex },
    { didMount },
    { useWindowScroll, windowScrollContainerState, windowViewportRect }
  ]) => {
    const getState = stream();
    const restoreStateFrom = statefulStream(void 0);
    const statefulWindowScrollContainerState = statefulStream(null);
    const statefulWindowViewportRect = statefulStream(null);
    connect(windowScrollContainerState, statefulWindowScrollContainerState);
    connect(windowViewportRect, statefulWindowViewportRect);
    subscribe(
      pipe(
        getState,
        withLatestFrom(sizes, scrollTop, useWindowScroll, statefulWindowScrollContainerState, statefulWindowViewportRect, headerHeight)
      ),
      ([callback, sizes2, scrollTop2, useWindowScroll2, windowScrollContainerState2, windowViewportRect2, headerHeight2]) => {
        const ranges = sizeTreeToRanges(sizes2.sizeTree);
        if (useWindowScroll2 && windowScrollContainerState2 !== null && windowViewportRect2 !== null) {
          scrollTop2 = windowScrollContainerState2.scrollTop - windowViewportRect2.offsetTop;
        }
        scrollTop2 -= headerHeight2;
        callback({ ranges, scrollTop: scrollTop2 });
      }
    );
    connect(pipe(restoreStateFrom, filter(isDefined), map(locationFromSnapshot)), initialTopMostItemIndex);
    connect(
      pipe(
        didMount,
        withLatestFrom(restoreStateFrom),
        filter(([, state]) => state !== void 0),
        distinctUntilChanged(),
        map(([, snapshot]) => {
          return snapshot.ranges;
        })
      ),
      sizeRanges
    );
    return {
      getState,
      restoreStateFrom
    };
  },
  tup(sizeSystem, domIOSystem, initialTopMostItemIndexSystem, propsReadySystem, windowScrollerSystem)
);
function locationFromSnapshot(snapshot) {
  return { offset: snapshot.scrollTop, index: 0, align: "start" };
}
const featureGroup1System = system(
  ([
    sizeRange,
    initialItemCount,
    propsReady,
    scrollSeek,
    totalListHeight,
    initialScrollTopSystem2,
    alignToBottom,
    windowScroller,
    scrollIntoView,
    logger
  ]) => {
    return {
      ...sizeRange,
      ...initialItemCount,
      ...propsReady,
      ...scrollSeek,
      ...totalListHeight,
      ...initialScrollTopSystem2,
      ...alignToBottom,
      ...windowScroller,
      ...scrollIntoView,
      ...logger
    };
  },
  tup(
    sizeRangeSystem,
    initialItemCountSystem,
    propsReadySystem,
    scrollSeekSystem,
    totalListHeightSystem,
    initialScrollTopSystem,
    alignToBottomSystem,
    windowScrollerSystem,
    scrollIntoViewSystem,
    loggerSystem
  )
);
const listSystem = system(
  ([
    {
      totalCount,
      sizeRanges,
      fixedItemSize,
      defaultItemSize,
      trackItemSizes,
      itemSize,
      data,
      firstItemIndex,
      groupIndices,
      statefulTotalCount,
      gap,
      sizes
    },
    { initialTopMostItemIndex, scrolledToInitialItem, initialItemFinalLocationReached },
    domIO,
    stateLoad,
    followOutput,
    { listState, topItemsIndexes, ...flags },
    { scrollToIndex },
    _,
    { topItemCount },
    { groupCounts },
    featureGroup1
  ]) => {
    connect(flags.rangeChanged, featureGroup1.scrollSeekRangeChanged);
    connect(
      pipe(
        featureGroup1.windowViewportRect,
        map((value) => value.visibleHeight)
      ),
      domIO.viewportHeight
    );
    return {
      // input
      totalCount,
      data,
      firstItemIndex,
      sizeRanges,
      initialTopMostItemIndex,
      scrolledToInitialItem,
      initialItemFinalLocationReached,
      topItemsIndexes,
      topItemCount,
      groupCounts,
      fixedItemHeight: fixedItemSize,
      defaultItemHeight: defaultItemSize,
      gap,
      ...followOutput,
      // output
      statefulTotalCount,
      listState,
      scrollToIndex,
      trackItemSizes,
      itemSize,
      groupIndices,
      // exported from stateFlagsSystem
      ...flags,
      // the bag of IO from featureGroup1System
      ...featureGroup1,
      ...domIO,
      sizes,
      ...stateLoad
    };
  },
  tup(
    sizeSystem,
    initialTopMostItemIndexSystem,
    domIOSystem,
    stateLoadSystem,
    followOutputSystem,
    listStateSystem,
    scrollToIndexSystem,
    upwardScrollFixSystem,
    topItemCountSystem,
    groupedListSystem,
    featureGroup1System
  )
);
const WEBKIT_STICKY = "-webkit-sticky";
const STICKY = "sticky";
const positionStickyCssValue = simpleMemoize(() => {
  if (typeof document === "undefined") {
    return STICKY;
  }
  const node = document.createElement("div");
  node.style.position = WEBKIT_STICKY;
  return node.style.position === WEBKIT_STICKY ? WEBKIT_STICKY : STICKY;
});
function useWindowViewportRectRef(callback, customScrollParent, skipAnimationFrame) {
  const viewportInfo = React.useRef(null);
  const calculateInfo = React.useCallback(
    (element) => {
      if (element === null || !element.offsetParent) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const visibleWidth = rect.width;
      let visibleHeight, offsetTop;
      if (customScrollParent) {
        const customScrollParentRect = customScrollParent.getBoundingClientRect();
        const deltaTop = rect.top - customScrollParentRect.top;
        visibleHeight = customScrollParentRect.height - Math.max(0, deltaTop);
        offsetTop = deltaTop + customScrollParent.scrollTop;
      } else {
        visibleHeight = window.innerHeight - Math.max(0, rect.top);
        offsetTop = rect.top + window.pageYOffset;
      }
      viewportInfo.current = {
        offsetTop,
        visibleHeight,
        visibleWidth
      };
      callback(viewportInfo.current);
    },
    [callback, customScrollParent]
  );
  const { callbackRef, ref } = useSizeWithElRef(calculateInfo, true, skipAnimationFrame);
  const scrollAndResizeEventHandler = React.useCallback(() => {
    calculateInfo(ref.current);
  }, [calculateInfo, ref]);
  React.useEffect(() => {
    if (customScrollParent) {
      customScrollParent.addEventListener("scroll", scrollAndResizeEventHandler);
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(scrollAndResizeEventHandler);
      });
      observer.observe(customScrollParent);
      return () => {
        customScrollParent.removeEventListener("scroll", scrollAndResizeEventHandler);
        observer.unobserve(customScrollParent);
      };
    } else {
      window.addEventListener("scroll", scrollAndResizeEventHandler);
      window.addEventListener("resize", scrollAndResizeEventHandler);
      return () => {
        window.removeEventListener("scroll", scrollAndResizeEventHandler);
        window.removeEventListener("resize", scrollAndResizeEventHandler);
      };
    }
  }, [scrollAndResizeEventHandler, customScrollParent]);
  return callbackRef;
}
const VirtuosoMockContext = React.createContext(void 0);
const VirtuosoGridMockContext = React.createContext(void 0);
function identity(value) {
  return value;
}
const listComponentPropsSystem = /* @__PURE__ */ system(() => {
  const itemContent = statefulStream((index) => `Item ${index}`);
  const context = statefulStream(null);
  const groupContent = statefulStream((index) => `Group ${index}`);
  const components = statefulStream({});
  const computeItemKey = statefulStream(identity);
  const HeaderFooterTag = statefulStream("div");
  const scrollerRef = statefulStream(noop);
  const distinctProp = (propName, defaultValue = null) => {
    return statefulStreamFromEmitter(
      pipe(
        components,
        map((components2) => components2[propName]),
        distinctUntilChanged()
      ),
      defaultValue
    );
  };
  return {
    context,
    itemContent,
    groupContent,
    components,
    computeItemKey,
    HeaderFooterTag,
    scrollerRef,
    FooterComponent: distinctProp("Footer"),
    HeaderComponent: distinctProp("Header"),
    TopItemListComponent: distinctProp("TopItemList"),
    ListComponent: distinctProp("List", "div"),
    ItemComponent: distinctProp("Item", "div"),
    GroupComponent: distinctProp("Group", "div"),
    ScrollerComponent: distinctProp("Scroller", "div"),
    EmptyPlaceholder: distinctProp("EmptyPlaceholder"),
    ScrollSeekPlaceholder: distinctProp("ScrollSeekPlaceholder")
  };
});
const combinedSystem$2 = /* @__PURE__ */ system(([listSystem2, propsSystem]) => {
  return { ...listSystem2, ...propsSystem };
}, tup(listSystem, listComponentPropsSystem));
const DefaultScrollSeekPlaceholder$1 = ({ height }) => /* @__PURE__ */ jsx("div", { style: { height } });
const GROUP_STYLE = { position: positionStickyCssValue(), zIndex: 1, overflowAnchor: "none" };
const ITEM_STYLE$1 = { overflowAnchor: "none" };
const HORIZONTAL_ITEM_STYLE = { ...ITEM_STYLE$1, display: "inline-block", height: "100%" };
const Items$1 = /* @__PURE__ */ React.memo(function VirtuosoItems({ showTopList = false }) {
  const listState = useEmitterValue$2("listState");
  const sizeRanges = usePublisher$2("sizeRanges");
  const useWindowScroll = useEmitterValue$2("useWindowScroll");
  const customScrollParent = useEmitterValue$2("customScrollParent");
  const windowScrollContainerStateCallback = usePublisher$2("windowScrollContainerState");
  const _scrollContainerStateCallback = usePublisher$2("scrollContainerState");
  const scrollContainerStateCallback = customScrollParent || useWindowScroll ? windowScrollContainerStateCallback : _scrollContainerStateCallback;
  const itemContent = useEmitterValue$2("itemContent");
  const context = useEmitterValue$2("context");
  const groupContent = useEmitterValue$2("groupContent");
  const trackItemSizes = useEmitterValue$2("trackItemSizes");
  const itemSize = useEmitterValue$2("itemSize");
  const log = useEmitterValue$2("log");
  const listGap = usePublisher$2("gap");
  const horizontalDirection = useEmitterValue$2("horizontalDirection");
  const { callbackRef } = useChangedListContentsSizes(
    sizeRanges,
    itemSize,
    trackItemSizes,
    showTopList ? noop : scrollContainerStateCallback,
    log,
    listGap,
    customScrollParent,
    horizontalDirection,
    useEmitterValue$2("skipAnimationFrameInResizeObserver")
  );
  const [deviation, setDeviation] = React.useState(0);
  useEmitter$2("deviation", (value) => {
    if (deviation !== value) {
      setDeviation(value);
    }
  });
  const EmptyPlaceholder = useEmitterValue$2("EmptyPlaceholder");
  const ScrollSeekPlaceholder = useEmitterValue$2("ScrollSeekPlaceholder") || DefaultScrollSeekPlaceholder$1;
  const ListComponent = useEmitterValue$2("ListComponent");
  const ItemComponent = useEmitterValue$2("ItemComponent");
  const GroupComponent = useEmitterValue$2("GroupComponent");
  const computeItemKey = useEmitterValue$2("computeItemKey");
  const isSeeking = useEmitterValue$2("isSeeking");
  const hasGroups2 = useEmitterValue$2("groupIndices").length > 0;
  const alignToBottom = useEmitterValue$2("alignToBottom");
  const initialItemFinalLocationReached = useEmitterValue$2("initialItemFinalLocationReached");
  const containerStyle = showTopList ? {} : {
    boxSizing: "border-box",
    ...horizontalDirection ? {
      whiteSpace: "nowrap",
      display: "inline-block",
      height: "100%",
      paddingLeft: listState.offsetTop,
      paddingRight: listState.offsetBottom,
      marginLeft: deviation !== 0 ? deviation : alignToBottom ? "auto" : 0
    } : {
      marginTop: deviation !== 0 ? deviation : alignToBottom ? "auto" : 0,
      paddingTop: listState.offsetTop,
      paddingBottom: listState.offsetBottom
    },
    ...initialItemFinalLocationReached ? {} : { visibility: "hidden" }
  };
  if (!showTopList && listState.totalCount === 0 && EmptyPlaceholder) {
    return /* @__PURE__ */ jsx(EmptyPlaceholder, { ...contextPropIfNotDomElement(EmptyPlaceholder, context) });
  }
  return /* @__PURE__ */ jsx(
    ListComponent,
    {
      ...contextPropIfNotDomElement(ListComponent, context),
      ref: callbackRef,
      style: containerStyle,
      "data-testid": showTopList ? "virtuoso-top-item-list" : "virtuoso-item-list",
      children: (showTopList ? listState.topItems : listState.items).map((item) => {
        const index = item.originalIndex;
        const key = computeItemKey(index + listState.firstItemIndex, item.data, context);
        if (isSeeking) {
          return /* @__PURE__ */ createElement(
            ScrollSeekPlaceholder,
            {
              ...contextPropIfNotDomElement(ScrollSeekPlaceholder, context),
              key,
              index: item.index,
              height: item.size,
              type: item.type || "item",
              ...item.type === "group" ? {} : { groupIndex: item.groupIndex }
            }
          );
        }
        if (item.type === "group") {
          return /* @__PURE__ */ createElement(
            GroupComponent,
            {
              ...contextPropIfNotDomElement(GroupComponent, context),
              key,
              "data-index": index,
              "data-known-size": item.size,
              "data-item-index": item.index,
              style: GROUP_STYLE
            },
            groupContent(item.index, context)
          );
        } else {
          return /* @__PURE__ */ createElement(
            ItemComponent,
            {
              ...contextPropIfNotDomElement(ItemComponent, context),
              ...itemPropIfNotDomElement(ItemComponent, item.data),
              key,
              "data-index": index,
              "data-known-size": item.size,
              "data-item-index": item.index,
              "data-item-group-index": item.groupIndex,
              style: horizontalDirection ? HORIZONTAL_ITEM_STYLE : ITEM_STYLE$1
            },
            hasGroups2 ? itemContent(item.index, item.groupIndex, item.data, context) : itemContent(item.index, item.data, context)
          );
        }
      })
    }
  );
});
const scrollerStyle = {
  height: "100%",
  outline: "none",
  overflowY: "auto",
  position: "relative",
  WebkitOverflowScrolling: "touch"
};
const horizontalScrollerStyle = {
  outline: "none",
  overflowX: "auto",
  position: "relative"
};
const viewportStyle = (alignToBottom) => ({
  width: "100%",
  height: "100%",
  position: "absolute",
  top: 0,
  ...alignToBottom ? { display: "flex", flexDirection: "column" } : {}
});
const topItemListStyle = {
  width: "100%",
  position: positionStickyCssValue(),
  top: 0,
  zIndex: 1
};
function contextPropIfNotDomElement(element, context) {
  if (typeof element === "string") {
    return void 0;
  }
  return { context };
}
function itemPropIfNotDomElement(element, item) {
  return { item: typeof element === "string" ? void 0 : item };
}
const Header$1 = /* @__PURE__ */ React.memo(function VirtuosoHeader() {
  const Header2 = useEmitterValue$2("HeaderComponent");
  const headerHeight = usePublisher$2("headerHeight");
  const HeaderFooterTag = useEmitterValue$2("HeaderFooterTag");
  const ref = useSize(
    React.useMemo(() => (el) => headerHeight(correctItemSize(el, "height")), [headerHeight]),
    true,
    useEmitterValue$2("skipAnimationFrameInResizeObserver")
  );
  const context = useEmitterValue$2("context");
  return Header2 ? /* @__PURE__ */ jsx(HeaderFooterTag, { ref, children: /* @__PURE__ */ jsx(Header2, { ...contextPropIfNotDomElement(Header2, context) }) }) : null;
});
const Footer$1 = /* @__PURE__ */ React.memo(function VirtuosoFooter() {
  const Footer2 = useEmitterValue$2("FooterComponent");
  const footerHeight = usePublisher$2("footerHeight");
  const HeaderFooterTag = useEmitterValue$2("HeaderFooterTag");
  const ref = useSize(
    React.useMemo(() => (el) => footerHeight(correctItemSize(el, "height")), [footerHeight]),
    true,
    useEmitterValue$2("skipAnimationFrameInResizeObserver")
  );
  const context = useEmitterValue$2("context");
  return Footer2 ? /* @__PURE__ */ jsx(HeaderFooterTag, { ref, children: /* @__PURE__ */ jsx(Footer2, { ...contextPropIfNotDomElement(Footer2, context) }) }) : null;
});
function buildScroller({ usePublisher: usePublisher2, useEmitter: useEmitter2, useEmitterValue: useEmitterValue2 }) {
  const Scroller2 = React.memo(function VirtuosoScroller({ style, children, ...props }) {
    const scrollContainerStateCallback = usePublisher2("scrollContainerState");
    const ScrollerComponent = useEmitterValue2("ScrollerComponent");
    const smoothScrollTargetReached = usePublisher2("smoothScrollTargetReached");
    const scrollerRefCallback = useEmitterValue2("scrollerRef");
    const context = useEmitterValue2("context");
    const horizontalDirection = useEmitterValue2("horizontalDirection") || false;
    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollContainerStateCallback,
      smoothScrollTargetReached,
      ScrollerComponent,
      scrollerRefCallback,
      void 0,
      horizontalDirection
    );
    useEmitter2("scrollTo", scrollToCallback);
    useEmitter2("scrollBy", scrollByCallback);
    const defaultStyle = horizontalDirection ? horizontalScrollerStyle : scrollerStyle;
    return /* @__PURE__ */ jsx(
      ScrollerComponent,
      {
        ref: scrollerRef,
        style: { ...defaultStyle, ...style },
        "data-testid": "virtuoso-scroller",
        "data-virtuoso-scroller": true,
        tabIndex: 0,
        ...props,
        ...contextPropIfNotDomElement(ScrollerComponent, context),
        children
      }
    );
  });
  return Scroller2;
}
function buildWindowScroller({ usePublisher: usePublisher2, useEmitter: useEmitter2, useEmitterValue: useEmitterValue2 }) {
  const Scroller2 = React.memo(function VirtuosoWindowScroller({ style, children, ...props }) {
    const scrollContainerStateCallback = usePublisher2("windowScrollContainerState");
    const ScrollerComponent = useEmitterValue2("ScrollerComponent");
    const smoothScrollTargetReached = usePublisher2("smoothScrollTargetReached");
    const totalListHeight = useEmitterValue2("totalListHeight");
    const deviation = useEmitterValue2("deviation");
    const customScrollParent = useEmitterValue2("customScrollParent");
    const context = useEmitterValue2("context");
    const { scrollerRef, scrollByCallback, scrollToCallback } = useScrollTop(
      scrollContainerStateCallback,
      smoothScrollTargetReached,
      ScrollerComponent,
      noop,
      customScrollParent
    );
    useIsomorphicLayoutEffect(() => {
      scrollerRef.current = customScrollParent ? customScrollParent : window;
      return () => {
        scrollerRef.current = null;
      };
    }, [scrollerRef, customScrollParent]);
    useEmitter2("windowScrollTo", scrollToCallback);
    useEmitter2("scrollBy", scrollByCallback);
    return /* @__PURE__ */ jsx(
      ScrollerComponent,
      {
        style: { position: "relative", ...style, ...totalListHeight !== 0 ? { height: totalListHeight + deviation } : {} },
        "data-virtuoso-scroller": true,
        ...props,
        ...contextPropIfNotDomElement(ScrollerComponent, context),
        children
      }
    );
  });
  return Scroller2;
}
const Viewport$2 = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext);
  const viewportHeight = usePublisher$2("viewportHeight");
  const fixedItemHeight = usePublisher$2("fixedItemHeight");
  const alignToBottom = useEmitterValue$2("alignToBottom");
  const horizontalDirection = useEmitterValue$2("horizontalDirection");
  const viewportSizeCallbackMemo = React.useMemo(
    () => compose(viewportHeight, (el) => correctItemSize(el, horizontalDirection ? "width" : "height")),
    [viewportHeight, horizontalDirection]
  );
  const viewportRef = useSize(viewportSizeCallbackMemo, true, useEmitterValue$2("skipAnimationFrameInResizeObserver"));
  React.useEffect(() => {
    if (ctx) {
      viewportHeight(ctx.viewportHeight);
      fixedItemHeight(ctx.itemHeight);
    }
  }, [ctx, viewportHeight, fixedItemHeight]);
  return /* @__PURE__ */ jsx("div", { style: viewportStyle(alignToBottom), ref: viewportRef, "data-viewport-type": "element", children });
};
const WindowViewport$2 = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext);
  const windowViewportRect = usePublisher$2("windowViewportRect");
  const fixedItemHeight = usePublisher$2("fixedItemHeight");
  const customScrollParent = useEmitterValue$2("customScrollParent");
  const viewportRef = useWindowViewportRectRef(
    windowViewportRect,
    customScrollParent,
    useEmitterValue$2("skipAnimationFrameInResizeObserver")
  );
  const alignToBottom = useEmitterValue$2("alignToBottom");
  React.useEffect(() => {
    if (ctx) {
      fixedItemHeight(ctx.itemHeight);
      windowViewportRect({ offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: 100 });
    }
  }, [ctx, windowViewportRect, fixedItemHeight]);
  return /* @__PURE__ */ jsx("div", { ref: viewportRef, style: viewportStyle(alignToBottom), "data-viewport-type": "window", children });
};
const TopItemListContainer = ({ children }) => {
  const TopItemList = useEmitterValue$2("TopItemListComponent") || "div";
  const headerHeight = useEmitterValue$2("headerHeight");
  const style = { ...topItemListStyle, marginTop: `${headerHeight}px` };
  const context = useEmitterValue$2("context");
  return /* @__PURE__ */ jsx(TopItemList, { style, ...contextPropIfNotDomElement(TopItemList, context), children });
};
const ListRoot = /* @__PURE__ */ React.memo(function VirtuosoRoot(props) {
  const useWindowScroll = useEmitterValue$2("useWindowScroll");
  const showTopList = useEmitterValue$2("topItemsIndexes").length > 0;
  const customScrollParent = useEmitterValue$2("customScrollParent");
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller$2 : Scroller$2;
  const TheViewport = customScrollParent || useWindowScroll ? WindowViewport$2 : Viewport$2;
  return /* @__PURE__ */ jsxs(TheScroller, { ...props, children: [
    showTopList && /* @__PURE__ */ jsx(TopItemListContainer, { children: /* @__PURE__ */ jsx(Items$1, { showTopList: true }) }),
    /* @__PURE__ */ jsxs(TheViewport, { children: [
      /* @__PURE__ */ jsx(Header$1, {}),
      /* @__PURE__ */ jsx(Items$1, {}),
      /* @__PURE__ */ jsx(Footer$1, {})
    ] })
  ] });
});
const {
  Component: List,
  usePublisher: usePublisher$2,
  useEmitterValue: useEmitterValue$2,
  useEmitter: useEmitter$2
} = /* @__PURE__ */ systemToComponent(
  combinedSystem$2,
  {
    required: {},
    optional: {
      restoreStateFrom: "restoreStateFrom",
      context: "context",
      followOutput: "followOutput",
      itemContent: "itemContent",
      groupContent: "groupContent",
      overscan: "overscan",
      increaseViewportBy: "increaseViewportBy",
      totalCount: "totalCount",
      groupCounts: "groupCounts",
      topItemCount: "topItemCount",
      firstItemIndex: "firstItemIndex",
      initialTopMostItemIndex: "initialTopMostItemIndex",
      components: "components",
      atBottomThreshold: "atBottomThreshold",
      atTopThreshold: "atTopThreshold",
      computeItemKey: "computeItemKey",
      defaultItemHeight: "defaultItemHeight",
      fixedItemHeight: "fixedItemHeight",
      itemSize: "itemSize",
      scrollSeekConfiguration: "scrollSeekConfiguration",
      headerFooterTag: "HeaderFooterTag",
      data: "data",
      initialItemCount: "initialItemCount",
      initialScrollTop: "initialScrollTop",
      alignToBottom: "alignToBottom",
      useWindowScroll: "useWindowScroll",
      customScrollParent: "customScrollParent",
      scrollerRef: "scrollerRef",
      logLevel: "logLevel",
      horizontalDirection: "horizontalDirection",
      skipAnimationFrameInResizeObserver: "skipAnimationFrameInResizeObserver"
    },
    methods: {
      scrollToIndex: "scrollToIndex",
      scrollIntoView: "scrollIntoView",
      scrollTo: "scrollTo",
      scrollBy: "scrollBy",
      autoscrollToBottom: "autoscrollToBottom",
      getState: "getState"
    },
    events: {
      isScrolling: "isScrolling",
      endReached: "endReached",
      startReached: "startReached",
      rangeChanged: "rangeChanged",
      atBottomStateChange: "atBottomStateChange",
      atTopStateChange: "atTopStateChange",
      totalListHeightChanged: "totalListHeightChanged",
      itemsRendered: "itemsRendered",
      groupIndices: "groupIndices"
    }
  },
  ListRoot
);
const Scroller$2 = /* @__PURE__ */ buildScroller({ usePublisher: usePublisher$2, useEmitterValue: useEmitterValue$2, useEmitter: useEmitter$2 });
const WindowScroller$2 = /* @__PURE__ */ buildWindowScroller({ usePublisher: usePublisher$2, useEmitterValue: useEmitterValue$2, useEmitter: useEmitter$2 });
const Virtuoso = List;
const GroupedVirtuoso = List;
const INITIAL_GRID_STATE = {
  items: [],
  offsetBottom: 0,
  offsetTop: 0,
  top: 0,
  bottom: 0,
  itemHeight: 0,
  itemWidth: 0
};
const PROBE_GRID_STATE = {
  items: [{ index: 0 }],
  offsetBottom: 0,
  offsetTop: 0,
  top: 0,
  bottom: 0,
  itemHeight: 0,
  itemWidth: 0
};
const { round, ceil, floor, min, max } = Math;
function buildProbeGridState(items) {
  return {
    ...PROBE_GRID_STATE,
    items
  };
}
function buildItems(startIndex, endIndex, data) {
  return Array.from({ length: endIndex - startIndex + 1 }).map((_, i) => {
    const dataItem = data === null ? null : data[i + startIndex];
    return { index: i + startIndex, data: dataItem };
  });
}
function gapComparator(prev, next) {
  return prev && prev.column === next.column && prev.row === next.row;
}
function dimensionComparator(prev, next) {
  return prev && prev.width === next.width && prev.height === next.height;
}
const gridSystem = /* @__PURE__ */ system(
  ([
    { overscan, visibleRange, listBoundary, increaseViewportBy },
    { scrollTop, viewportHeight, scrollBy, scrollTo, smoothScrollTargetReached, scrollContainerState, footerHeight, headerHeight },
    stateFlags,
    scrollSeek,
    { propsReady, didMount },
    { windowViewportRect, useWindowScroll, customScrollParent, windowScrollContainerState, windowScrollTo },
    log
  ]) => {
    const totalCount = statefulStream(0);
    const initialItemCount = statefulStream(0);
    const gridState = statefulStream(INITIAL_GRID_STATE);
    const viewportDimensions = statefulStream({ height: 0, width: 0 });
    const itemDimensions = statefulStream({ height: 0, width: 0 });
    const scrollToIndex = stream();
    const scrollHeight = stream();
    const deviation = statefulStream(0);
    const data = statefulStream(null);
    const gap = statefulStream({ row: 0, column: 0 });
    const stateChanged = stream();
    const restoreStateFrom = stream();
    const stateRestoreInProgress = statefulStream(false);
    const initialTopMostItemIndex = statefulStream(0);
    const scrolledToInitialItem = statefulStream(true);
    const scrollScheduled = statefulStream(false);
    const horizontalDirection = statefulStream(false);
    subscribe(
      pipe(
        didMount,
        withLatestFrom(initialTopMostItemIndex),
        filter(([_, location]) => !!location)
      ),
      () => {
        publish(scrolledToInitialItem, false);
      }
    );
    subscribe(
      pipe(
        combineLatest(didMount, scrolledToInitialItem, itemDimensions, viewportDimensions, initialTopMostItemIndex, scrollScheduled),
        filter(([didMount2, scrolledToInitialItem2, itemDimensions2, viewportDimensions2, , scrollScheduled2]) => {
          return didMount2 && !scrolledToInitialItem2 && itemDimensions2.height !== 0 && viewportDimensions2.height !== 0 && !scrollScheduled2;
        })
      ),
      ([, , , , initialTopMostItemIndex2]) => {
        publish(scrollScheduled, true);
        skipFrames(1, () => {
          publish(scrollToIndex, initialTopMostItemIndex2);
        });
        handleNext(pipe(scrollTop), () => {
          publish(listBoundary, [0, 0]);
          publish(scrolledToInitialItem, true);
        });
      }
    );
    connect(
      pipe(
        restoreStateFrom,
        filter((value) => value !== void 0 && value !== null && value.scrollTop > 0),
        mapTo(0)
      ),
      initialItemCount
    );
    subscribe(
      pipe(
        didMount,
        withLatestFrom(restoreStateFrom),
        filter(([, snapshot]) => snapshot !== void 0 && snapshot !== null)
      ),
      ([, snapshot]) => {
        if (!snapshot) {
          return;
        }
        publish(viewportDimensions, snapshot.viewport), publish(itemDimensions, snapshot == null ? void 0 : snapshot.item);
        publish(gap, snapshot.gap);
        if (snapshot.scrollTop > 0) {
          publish(stateRestoreInProgress, true);
          handleNext(pipe(scrollTop, skip(1)), (_value) => {
            publish(stateRestoreInProgress, false);
          });
          publish(scrollTo, { top: snapshot.scrollTop });
        }
      }
    );
    connect(
      pipe(
        viewportDimensions,
        map(({ height }) => height)
      ),
      viewportHeight
    );
    connect(
      pipe(
        combineLatest(
          duc(viewportDimensions, dimensionComparator),
          duc(itemDimensions, dimensionComparator),
          duc(gap, (prev, next) => prev && prev.column === next.column && prev.row === next.row),
          duc(scrollTop)
        ),
        map(([viewport, item, gap2, scrollTop2]) => ({
          viewport,
          item,
          gap: gap2,
          scrollTop: scrollTop2
        }))
      ),
      stateChanged
    );
    connect(
      pipe(
        combineLatest(
          duc(totalCount),
          visibleRange,
          duc(gap, gapComparator),
          duc(itemDimensions, dimensionComparator),
          duc(viewportDimensions, dimensionComparator),
          duc(data),
          duc(initialItemCount),
          duc(stateRestoreInProgress),
          duc(scrolledToInitialItem),
          duc(initialTopMostItemIndex)
        ),
        filter(([, , , , , , , stateRestoreInProgress2]) => {
          return !stateRestoreInProgress2;
        }),
        map(
          ([
            totalCount2,
            [startOffset, endOffset],
            gap2,
            item,
            viewport,
            data2,
            initialItemCount2,
            ,
            scrolledToInitialItem2,
            initialTopMostItemIndex2
          ]) => {
            const { row: rowGap, column: columnGap } = gap2;
            const { height: itemHeight, width: itemWidth } = item;
            const { width: viewportWidth } = viewport;
            if (initialItemCount2 === 0 && (totalCount2 === 0 || viewportWidth === 0)) {
              return INITIAL_GRID_STATE;
            }
            if (itemWidth === 0) {
              const startIndex2 = getInitialTopMostItemIndexNumber(initialTopMostItemIndex2, totalCount2);
              const endIndex2 = Math.max(startIndex2 + initialItemCount2 - 1, 0);
              return buildProbeGridState(buildItems(startIndex2, endIndex2, data2));
            }
            const perRow = itemsPerRow(viewportWidth, itemWidth, columnGap);
            let startIndex;
            let endIndex;
            if (!scrolledToInitialItem2) {
              startIndex = 0;
              endIndex = -1;
            } else if (startOffset === 0 && endOffset === 0 && initialItemCount2 > 0) {
              startIndex = 0;
              endIndex = initialItemCount2 - 1;
            } else {
              startIndex = perRow * floor((startOffset + rowGap) / (itemHeight + rowGap));
              endIndex = perRow * ceil((endOffset + rowGap) / (itemHeight + rowGap)) - 1;
              endIndex = min(totalCount2 - 1, max(endIndex, perRow - 1));
              startIndex = min(endIndex, max(0, startIndex));
            }
            const items = buildItems(startIndex, endIndex, data2);
            const { top, bottom } = gridLayout(viewport, gap2, item, items);
            const rowCount = ceil(totalCount2 / perRow);
            const totalHeight = rowCount * itemHeight + (rowCount - 1) * rowGap;
            const offsetBottom = totalHeight - bottom;
            return { items, offsetTop: top, offsetBottom, top, bottom, itemHeight, itemWidth };
          }
        )
      ),
      gridState
    );
    connect(
      pipe(
        data,
        filter((data2) => data2 !== null),
        map((data2) => data2.length)
      ),
      totalCount
    );
    connect(
      pipe(
        combineLatest(viewportDimensions, itemDimensions, gridState, gap),
        filter(([viewportDimensions2, itemDimensions2, { items }]) => {
          return items.length > 0 && itemDimensions2.height !== 0 && viewportDimensions2.height !== 0;
        }),
        map(([viewportDimensions2, itemDimensions2, { items }, gap2]) => {
          const { top, bottom } = gridLayout(viewportDimensions2, gap2, itemDimensions2, items);
          return [top, bottom];
        }),
        distinctUntilChanged(tupleComparator)
      ),
      listBoundary
    );
    const hasScrolled = statefulStream(false);
    connect(
      pipe(
        scrollTop,
        withLatestFrom(hasScrolled),
        map(([scrollTop2, hasScrolled2]) => {
          return hasScrolled2 || scrollTop2 !== 0;
        })
      ),
      hasScrolled
    );
    const endReached = streamFromEmitter(
      pipe(
        duc(gridState),
        filter(({ items }) => items.length > 0),
        withLatestFrom(totalCount, hasScrolled),
        filter(([{ items }, totalCount2, hasScrolled2]) => hasScrolled2 && items[items.length - 1].index === totalCount2 - 1),
        map(([, totalCount2]) => totalCount2 - 1),
        distinctUntilChanged()
      )
    );
    const startReached = streamFromEmitter(
      pipe(
        duc(gridState),
        filter(({ items }) => {
          return items.length > 0 && items[0].index === 0;
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mapTo(0),
        distinctUntilChanged()
      )
    );
    const rangeChanged = streamFromEmitter(
      pipe(
        duc(gridState),
        withLatestFrom(stateRestoreInProgress),
        filter(([{ items }, stateRestoreInProgress2]) => items.length > 0 && !stateRestoreInProgress2),
        map(([{ items }]) => {
          return {
            startIndex: items[0].index,
            endIndex: items[items.length - 1].index
          };
        }),
        distinctUntilChanged(rangeComparator),
        throttleTime(0)
      )
    );
    connect(rangeChanged, scrollSeek.scrollSeekRangeChanged);
    connect(
      pipe(
        scrollToIndex,
        withLatestFrom(viewportDimensions, itemDimensions, totalCount, gap),
        map(([location, viewportDimensions2, itemDimensions2, totalCount2, gap2]) => {
          const normalLocation = normalizeIndexLocation(location);
          const { align, behavior, offset } = normalLocation;
          let index = normalLocation.index;
          if (index === "LAST") {
            index = totalCount2 - 1;
          }
          index = max(0, index, min(totalCount2 - 1, index));
          let top = itemTop(viewportDimensions2, gap2, itemDimensions2, index);
          if (align === "end") {
            top = round(top - viewportDimensions2.height + itemDimensions2.height);
          } else if (align === "center") {
            top = round(top - viewportDimensions2.height / 2 + itemDimensions2.height / 2);
          }
          if (offset) {
            top += offset;
          }
          return { top, behavior };
        })
      ),
      scrollTo
    );
    const totalListHeight = statefulStreamFromEmitter(
      pipe(
        gridState,
        map((gridState2) => {
          return gridState2.offsetBottom + gridState2.bottom;
        })
      ),
      0
    );
    connect(
      pipe(
        windowViewportRect,
        map((viewportInfo) => ({ width: viewportInfo.visibleWidth, height: viewportInfo.visibleHeight }))
      ),
      viewportDimensions
    );
    return {
      // input
      data,
      totalCount,
      viewportDimensions,
      itemDimensions,
      scrollTop,
      scrollHeight,
      overscan,
      increaseViewportBy,
      scrollBy,
      scrollTo,
      scrollToIndex,
      smoothScrollTargetReached,
      windowViewportRect,
      windowScrollTo,
      useWindowScroll,
      customScrollParent,
      windowScrollContainerState,
      deviation,
      scrollContainerState,
      footerHeight,
      headerHeight,
      initialItemCount,
      gap,
      restoreStateFrom,
      ...scrollSeek,
      initialTopMostItemIndex,
      horizontalDirection,
      // output
      gridState,
      totalListHeight,
      ...stateFlags,
      startReached,
      endReached,
      rangeChanged,
      stateChanged,
      propsReady,
      stateRestoreInProgress,
      ...log
    };
  },
  tup(sizeRangeSystem, domIOSystem, stateFlagsSystem, scrollSeekSystem, propsReadySystem, windowScrollerSystem, loggerSystem)
);
function gridLayout(viewport, gap, item, items) {
  const { height: itemHeight } = item;
  if (itemHeight === void 0 || items.length === 0) {
    return { top: 0, bottom: 0 };
  }
  const top = itemTop(viewport, gap, item, items[0].index);
  const bottom = itemTop(viewport, gap, item, items[items.length - 1].index) + itemHeight;
  return { top, bottom };
}
function itemTop(viewport, gap, item, index) {
  const perRow = itemsPerRow(viewport.width, item.width, gap.column);
  const rowCount = floor(index / perRow);
  const top = rowCount * item.height + max(0, rowCount - 1) * gap.row;
  return top > 0 ? top + gap.row : top;
}
function itemsPerRow(viewportWidth, itemWidth, gap) {
  return max(1, floor((viewportWidth + gap) / (floor(itemWidth) + gap)));
}
const gridComponentPropsSystem = /* @__PURE__ */ system(() => {
  const itemContent = statefulStream((index) => `Item ${index}`);
  const components = statefulStream({});
  const context = statefulStream(null);
  const itemClassName = statefulStream("virtuoso-grid-item");
  const listClassName = statefulStream("virtuoso-grid-list");
  const computeItemKey = statefulStream(identity);
  const headerFooterTag = statefulStream("div");
  const scrollerRef = statefulStream(noop);
  const distinctProp = (propName, defaultValue = null) => {
    return statefulStreamFromEmitter(
      pipe(
        components,
        map((components2) => components2[propName]),
        distinctUntilChanged()
      ),
      defaultValue
    );
  };
  const readyStateChanged = statefulStream(false);
  const reportReadyState = statefulStream(false);
  connect(duc(reportReadyState), readyStateChanged);
  return {
    readyStateChanged,
    reportReadyState,
    context,
    itemContent,
    components,
    computeItemKey,
    itemClassName,
    listClassName,
    headerFooterTag,
    scrollerRef,
    FooterComponent: distinctProp("Footer"),
    HeaderComponent: distinctProp("Header"),
    ListComponent: distinctProp("List", "div"),
    ItemComponent: distinctProp("Item", "div"),
    ScrollerComponent: distinctProp("Scroller", "div"),
    ScrollSeekPlaceholder: distinctProp("ScrollSeekPlaceholder", "div")
  };
});
const combinedSystem$1 = /* @__PURE__ */ system(([gridSystem2, gridComponentPropsSystem2]) => {
  return { ...gridSystem2, ...gridComponentPropsSystem2 };
}, tup(gridSystem, gridComponentPropsSystem));
const GridItems = /* @__PURE__ */ React.memo(function GridItems2() {
  const gridState = useEmitterValue$1("gridState");
  const listClassName = useEmitterValue$1("listClassName");
  const itemClassName = useEmitterValue$1("itemClassName");
  const itemContent = useEmitterValue$1("itemContent");
  const computeItemKey = useEmitterValue$1("computeItemKey");
  const isSeeking = useEmitterValue$1("isSeeking");
  const scrollHeightCallback = usePublisher$1("scrollHeight");
  const ItemComponent = useEmitterValue$1("ItemComponent");
  const ListComponent = useEmitterValue$1("ListComponent");
  const ScrollSeekPlaceholder = useEmitterValue$1("ScrollSeekPlaceholder");
  const context = useEmitterValue$1("context");
  const itemDimensions = usePublisher$1("itemDimensions");
  const gridGap = usePublisher$1("gap");
  const log = useEmitterValue$1("log");
  const stateRestoreInProgress = useEmitterValue$1("stateRestoreInProgress");
  const reportReadyState = usePublisher$1("reportReadyState");
  const listRef = useSize(
    React.useMemo(
      () => (el) => {
        const scrollHeight = el.parentElement.parentElement.scrollHeight;
        scrollHeightCallback(scrollHeight);
        const firstItem = el.firstChild;
        if (firstItem) {
          const { width, height } = firstItem.getBoundingClientRect();
          itemDimensions({ width, height });
        }
        gridGap({
          row: resolveGapValue("row-gap", getComputedStyle(el).rowGap, log),
          column: resolveGapValue("column-gap", getComputedStyle(el).columnGap, log)
        });
      },
      [scrollHeightCallback, itemDimensions, gridGap, log]
    ),
    true,
    false
  );
  useIsomorphicLayoutEffect(() => {
    if (gridState.itemHeight > 0 && gridState.itemWidth > 0) {
      reportReadyState(true);
    }
  }, [gridState]);
  if (stateRestoreInProgress) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    ListComponent,
    {
      ref: listRef,
      className: listClassName,
      ...contextPropIfNotDomElement(ListComponent, context),
      style: { paddingTop: gridState.offsetTop, paddingBottom: gridState.offsetBottom },
      "data-testid": "virtuoso-item-list",
      children: gridState.items.map((item) => {
        const key = computeItemKey(item.index, item.data, context);
        return isSeeking ? /* @__PURE__ */ jsx(
          ScrollSeekPlaceholder,
          {
            ...contextPropIfNotDomElement(ScrollSeekPlaceholder, context),
            index: item.index,
            height: gridState.itemHeight,
            width: gridState.itemWidth
          },
          key
        ) : /* @__PURE__ */ createElement(
          ItemComponent,
          {
            ...contextPropIfNotDomElement(ItemComponent, context),
            className: itemClassName,
            "data-index": item.index,
            key
          },
          itemContent(item.index, item.data, context)
        );
      })
    }
  );
});
const Header = React.memo(function VirtuosoHeader2() {
  const Header2 = useEmitterValue$1("HeaderComponent");
  const headerHeight = usePublisher$1("headerHeight");
  const HeaderFooterTag = useEmitterValue$1("headerFooterTag");
  const ref = useSize(
    React.useMemo(() => (el) => headerHeight(correctItemSize(el, "height")), [headerHeight]),
    true,
    false
  );
  const context = useEmitterValue$1("context");
  return Header2 ? /* @__PURE__ */ jsx(HeaderFooterTag, { ref, children: /* @__PURE__ */ jsx(Header2, { ...contextPropIfNotDomElement(Header2, context) }) }) : null;
});
const Footer = React.memo(function VirtuosoGridFooter() {
  const Footer2 = useEmitterValue$1("FooterComponent");
  const footerHeight = usePublisher$1("footerHeight");
  const HeaderFooterTag = useEmitterValue$1("headerFooterTag");
  const ref = useSize(
    React.useMemo(() => (el) => footerHeight(correctItemSize(el, "height")), [footerHeight]),
    true,
    false
  );
  const context = useEmitterValue$1("context");
  return Footer2 ? /* @__PURE__ */ jsx(HeaderFooterTag, { ref, children: /* @__PURE__ */ jsx(Footer2, { ...contextPropIfNotDomElement(Footer2, context) }) }) : null;
});
const Viewport$1 = ({ children }) => {
  const ctx = React.useContext(VirtuosoGridMockContext);
  const itemDimensions = usePublisher$1("itemDimensions");
  const viewportDimensions = usePublisher$1("viewportDimensions");
  const viewportRef = useSize(
    React.useMemo(
      () => (el) => {
        viewportDimensions(el.getBoundingClientRect());
      },
      [viewportDimensions]
    ),
    true,
    false
  );
  React.useEffect(() => {
    if (ctx) {
      viewportDimensions({ height: ctx.viewportHeight, width: ctx.viewportWidth });
      itemDimensions({ height: ctx.itemHeight, width: ctx.itemWidth });
    }
  }, [ctx, viewportDimensions, itemDimensions]);
  return /* @__PURE__ */ jsx("div", { style: viewportStyle(false), ref: viewportRef, children });
};
const WindowViewport$1 = ({ children }) => {
  const ctx = React.useContext(VirtuosoGridMockContext);
  const windowViewportRect = usePublisher$1("windowViewportRect");
  const itemDimensions = usePublisher$1("itemDimensions");
  const customScrollParent = useEmitterValue$1("customScrollParent");
  const viewportRef = useWindowViewportRectRef(windowViewportRect, customScrollParent, false);
  React.useEffect(() => {
    if (ctx) {
      itemDimensions({ height: ctx.itemHeight, width: ctx.itemWidth });
      windowViewportRect({ offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: ctx.viewportWidth });
    }
  }, [ctx, windowViewportRect, itemDimensions]);
  return /* @__PURE__ */ jsx("div", { ref: viewportRef, style: viewportStyle(false), children });
};
const GridRoot = /* @__PURE__ */ React.memo(function GridRoot2({ ...props }) {
  const useWindowScroll = useEmitterValue$1("useWindowScroll");
  const customScrollParent = useEmitterValue$1("customScrollParent");
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller$1 : Scroller$1;
  const TheViewport = customScrollParent || useWindowScroll ? WindowViewport$1 : Viewport$1;
  return /* @__PURE__ */ jsx(TheScroller, { ...props, children: /* @__PURE__ */ jsxs(TheViewport, { children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx(GridItems, {}),
    /* @__PURE__ */ jsx(Footer, {})
  ] }) });
});
const {
  Component: Grid,
  usePublisher: usePublisher$1,
  useEmitterValue: useEmitterValue$1,
  useEmitter: useEmitter$1
} = /* @__PURE__ */ systemToComponent(
  combinedSystem$1,
  {
    optional: {
      context: "context",
      totalCount: "totalCount",
      overscan: "overscan",
      itemContent: "itemContent",
      components: "components",
      computeItemKey: "computeItemKey",
      data: "data",
      initialItemCount: "initialItemCount",
      scrollSeekConfiguration: "scrollSeekConfiguration",
      headerFooterTag: "headerFooterTag",
      listClassName: "listClassName",
      itemClassName: "itemClassName",
      useWindowScroll: "useWindowScroll",
      customScrollParent: "customScrollParent",
      scrollerRef: "scrollerRef",
      logLevel: "logLevel",
      restoreStateFrom: "restoreStateFrom",
      initialTopMostItemIndex: "initialTopMostItemIndex",
      increaseViewportBy: "increaseViewportBy"
    },
    methods: {
      scrollTo: "scrollTo",
      scrollBy: "scrollBy",
      scrollToIndex: "scrollToIndex"
    },
    events: {
      isScrolling: "isScrolling",
      endReached: "endReached",
      startReached: "startReached",
      rangeChanged: "rangeChanged",
      atBottomStateChange: "atBottomStateChange",
      atTopStateChange: "atTopStateChange",
      stateChanged: "stateChanged",
      readyStateChanged: "readyStateChanged"
    }
  },
  GridRoot
);
const Scroller$1 = /* @__PURE__ */ buildScroller({ usePublisher: usePublisher$1, useEmitterValue: useEmitterValue$1, useEmitter: useEmitter$1 });
const WindowScroller$1 = /* @__PURE__ */ buildWindowScroller({ usePublisher: usePublisher$1, useEmitterValue: useEmitterValue$1, useEmitter: useEmitter$1 });
function resolveGapValue(property, value, log) {
  if (value !== "normal" && !(value == null ? void 0 : value.endsWith("px"))) {
    log(`${property} was not resolved to pixel value correctly`, value, LogLevel.WARN);
  }
  if (value === "normal") {
    return 0;
  }
  return parseInt(value != null ? value : "0", 10);
}
const VirtuosoGrid = Grid;
const tableComponentPropsSystem = /* @__PURE__ */ system(() => {
  const itemContent = statefulStream((index) => /* @__PURE__ */ jsxs("td", { children: [
    "Item $",
    index
  ] }));
  const context = statefulStream(null);
  const fixedHeaderContent = statefulStream(null);
  const fixedFooterContent = statefulStream(null);
  const components = statefulStream({});
  const computeItemKey = statefulStream(identity);
  const scrollerRef = statefulStream(noop);
  const distinctProp = (propName, defaultValue = null) => {
    return statefulStreamFromEmitter(
      pipe(
        components,
        map((components2) => components2[propName]),
        distinctUntilChanged()
      ),
      defaultValue
    );
  };
  return {
    context,
    itemContent,
    fixedHeaderContent,
    fixedFooterContent,
    components,
    computeItemKey,
    scrollerRef,
    TableComponent: distinctProp("Table", "table"),
    TableHeadComponent: distinctProp("TableHead", "thead"),
    TableFooterComponent: distinctProp("TableFoot", "tfoot"),
    TableBodyComponent: distinctProp("TableBody", "tbody"),
    TableRowComponent: distinctProp("TableRow", "tr"),
    ScrollerComponent: distinctProp("Scroller", "div"),
    EmptyPlaceholder: distinctProp("EmptyPlaceholder"),
    ScrollSeekPlaceholder: distinctProp("ScrollSeekPlaceholder"),
    FillerRow: distinctProp("FillerRow")
  };
});
const combinedSystem = /* @__PURE__ */ system(([listSystem2, propsSystem]) => {
  return { ...listSystem2, ...propsSystem };
}, tup(listSystem, tableComponentPropsSystem));
const DefaultScrollSeekPlaceholder = ({ height }) => /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style: { height } }) });
const DefaultFillerRow = ({ height }) => /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { style: { height, padding: 0, border: 0 } }) });
const ITEM_STYLE = { overflowAnchor: "none" };
const Items = /* @__PURE__ */ React.memo(function VirtuosoItems2({ showTopList = false }) {
  const listState = useEmitterValue("listState");
  const computeItemKey = useEmitterValue("computeItemKey");
  const firstItemIndex = useEmitterValue("firstItemIndex");
  const isSeeking = useEmitterValue("isSeeking");
  const ScrollSeekPlaceholder = useEmitterValue("ScrollSeekPlaceholder") || DefaultScrollSeekPlaceholder;
  const context = useEmitterValue("context");
  const TableRowComponent = useEmitterValue("TableRowComponent");
  const fixedHeaderHeight = useEmitterValue("fixedHeaderHeight");
  const itemContent = useEmitterValue("itemContent");
  const topItemOffsets = (showTopList ? listState.topItems : []).reduce((acc, item, index) => {
    if (index === 0) {
      acc.push(item.size);
    } else {
      acc.push(acc[index - 1] + item.size);
    }
    return acc;
  }, []);
  const items = (showTopList ? listState.topItems : listState.items).map((item) => {
    const index = item.originalIndex;
    const key = computeItemKey(index + firstItemIndex, item.data, context);
    const offsetTop = showTopList ? index === 0 ? 0 : topItemOffsets[index - 1] : 0;
    if (isSeeking) {
      return /* @__PURE__ */ createElement(
        ScrollSeekPlaceholder,
        {
          ...contextPropIfNotDomElement(ScrollSeekPlaceholder, context),
          key,
          index: item.index,
          height: item.size,
          type: item.type || "item"
        }
      );
    }
    return /* @__PURE__ */ createElement(
      TableRowComponent,
      {
        ...contextPropIfNotDomElement(TableRowComponent, context),
        ...itemPropIfNotDomElement(TableRowComponent, item.data),
        key,
        "data-index": index,
        "data-known-size": item.size,
        "data-item-index": item.index,
        style: showTopList ? { overflowAnchor: "none", position: "sticky", zIndex: 2, top: fixedHeaderHeight + offsetTop } : ITEM_STYLE
      },
      itemContent(item.index, item.data, context)
    );
  });
  return /* @__PURE__ */ jsx(Fragment, { children: items });
});
const TableBody = /* @__PURE__ */ React.memo(function TableVirtuosoBody() {
  const listState = useEmitterValue("listState");
  const showTopList = useEmitterValue("topItemsIndexes").length > 0;
  const sizeRanges = usePublisher("sizeRanges");
  const useWindowScroll = useEmitterValue("useWindowScroll");
  const customScrollParent = useEmitterValue("customScrollParent");
  const windowScrollContainerStateCallback = usePublisher("windowScrollContainerState");
  const _scrollContainerStateCallback = usePublisher("scrollContainerState");
  const scrollContainerStateCallback = customScrollParent || useWindowScroll ? windowScrollContainerStateCallback : _scrollContainerStateCallback;
  const trackItemSizes = useEmitterValue("trackItemSizes");
  const itemSize = useEmitterValue("itemSize");
  const log = useEmitterValue("log");
  const { callbackRef, ref } = useChangedListContentsSizes(
    sizeRanges,
    itemSize,
    trackItemSizes,
    scrollContainerStateCallback,
    log,
    void 0,
    customScrollParent,
    false,
    useEmitterValue("skipAnimationFrameInResizeObserver")
  );
  const [deviation, setDeviation] = React.useState(0);
  useEmitter("deviation", (value) => {
    if (deviation !== value) {
      ref.current.style.marginTop = `${value}px`;
      setDeviation(value);
    }
  });
  const EmptyPlaceholder = useEmitterValue("EmptyPlaceholder");
  const FillerRow = useEmitterValue("FillerRow") || DefaultFillerRow;
  const TableBodyComponent = useEmitterValue("TableBodyComponent");
  const paddingTopAddition = useEmitterValue("paddingTopAddition");
  const statefulTotalCount = useEmitterValue("statefulTotalCount");
  const context = useEmitterValue("context");
  if (statefulTotalCount === 0 && EmptyPlaceholder) {
    return /* @__PURE__ */ jsx(EmptyPlaceholder, { ...contextPropIfNotDomElement(EmptyPlaceholder, context) });
  }
  const topItemsSize = (showTopList ? listState.topItems : []).reduce((acc, item) => acc + item.size, 0);
  const paddingTop = listState.offsetTop + paddingTopAddition + deviation - topItemsSize;
  const paddingBottom = listState.offsetBottom;
  const paddingTopEl = paddingTop > 0 ? /* @__PURE__ */ jsx(FillerRow, { height: paddingTop, context }, "padding-top") : null;
  const paddingBottomEl = paddingBottom > 0 ? /* @__PURE__ */ jsx(FillerRow, { height: paddingBottom, context }, "padding-bottom") : null;
  return /* @__PURE__ */ jsxs(TableBodyComponent, { ref: callbackRef, "data-testid": "virtuoso-item-list", ...contextPropIfNotDomElement(TableBodyComponent, context), children: [
    paddingTopEl,
    showTopList && /* @__PURE__ */ jsx(Items, { showTopList: true }),
    /* @__PURE__ */ jsx(Items, {}),
    paddingBottomEl
  ] });
});
const Viewport = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext);
  const viewportHeight = usePublisher("viewportHeight");
  const fixedItemHeight = usePublisher("fixedItemHeight");
  const viewportRef = useSize(
    React.useMemo(() => compose(viewportHeight, (el) => correctItemSize(el, "height")), [viewportHeight]),
    true,
    useEmitterValue("skipAnimationFrameInResizeObserver")
  );
  React.useEffect(() => {
    if (ctx) {
      viewportHeight(ctx.viewportHeight);
      fixedItemHeight(ctx.itemHeight);
    }
  }, [ctx, viewportHeight, fixedItemHeight]);
  return /* @__PURE__ */ jsx("div", { style: viewportStyle(false), ref: viewportRef, "data-viewport-type": "element", children });
};
const WindowViewport = ({ children }) => {
  const ctx = React.useContext(VirtuosoMockContext);
  const windowViewportRect = usePublisher("windowViewportRect");
  const fixedItemHeight = usePublisher("fixedItemHeight");
  const customScrollParent = useEmitterValue("customScrollParent");
  const viewportRef = useWindowViewportRectRef(
    windowViewportRect,
    customScrollParent,
    useEmitterValue("skipAnimationFrameInResizeObserver")
  );
  React.useEffect(() => {
    if (ctx) {
      fixedItemHeight(ctx.itemHeight);
      windowViewportRect({ offsetTop: 0, visibleHeight: ctx.viewportHeight, visibleWidth: 100 });
    }
  }, [ctx, windowViewportRect, fixedItemHeight]);
  return /* @__PURE__ */ jsx("div", { ref: viewportRef, style: viewportStyle(false), "data-viewport-type": "window", children });
};
const TableRoot = /* @__PURE__ */ React.memo(function TableVirtuosoRoot(props) {
  const useWindowScroll = useEmitterValue("useWindowScroll");
  const customScrollParent = useEmitterValue("customScrollParent");
  const fixedHeaderHeight = usePublisher("fixedHeaderHeight");
  const fixedFooterHeight = usePublisher("fixedFooterHeight");
  const fixedHeaderContent = useEmitterValue("fixedHeaderContent");
  const fixedFooterContent = useEmitterValue("fixedFooterContent");
  const context = useEmitterValue("context");
  const theadRef = useSize(
    React.useMemo(() => compose(fixedHeaderHeight, (el) => correctItemSize(el, "height")), [fixedHeaderHeight]),
    true,
    useEmitterValue("skipAnimationFrameInResizeObserver")
  );
  const tfootRef = useSize(
    React.useMemo(() => compose(fixedFooterHeight, (el) => correctItemSize(el, "height")), [fixedFooterHeight]),
    true,
    useEmitterValue("skipAnimationFrameInResizeObserver")
  );
  const TheScroller = customScrollParent || useWindowScroll ? WindowScroller : Scroller;
  const TheViewport = customScrollParent || useWindowScroll ? WindowViewport : Viewport;
  const TheTable = useEmitterValue("TableComponent");
  const TheTHead = useEmitterValue("TableHeadComponent");
  const TheTFoot = useEmitterValue("TableFooterComponent");
  const theHead = fixedHeaderContent ? /* @__PURE__ */ jsx(
    TheTHead,
    {
      style: { zIndex: 2, position: "sticky", top: 0 },
      ref: theadRef,
      ...contextPropIfNotDomElement(TheTHead, context),
      children: fixedHeaderContent()
    },
    "TableHead"
  ) : null;
  const theFoot = fixedFooterContent ? /* @__PURE__ */ jsx(
    TheTFoot,
    {
      style: { zIndex: 1, position: "sticky", bottom: 0 },
      ref: tfootRef,
      ...contextPropIfNotDomElement(TheTFoot, context),
      children: fixedFooterContent()
    },
    "TableFoot"
  ) : null;
  return /* @__PURE__ */ jsx(TheScroller, { ...props, children: /* @__PURE__ */ jsx(TheViewport, { children: /* @__PURE__ */ jsxs(TheTable, { style: { borderSpacing: 0, overflowAnchor: "none" }, ...contextPropIfNotDomElement(TheTable, context), children: [
    theHead,
    /* @__PURE__ */ jsx(TableBody, {}, "TableBody"),
    theFoot
  ] }) }) });
});
const {
  Component: Table,
  usePublisher,
  useEmitterValue,
  useEmitter
} = /* @__PURE__ */ systemToComponent(
  combinedSystem,
  {
    required: {},
    optional: {
      restoreStateFrom: "restoreStateFrom",
      context: "context",
      followOutput: "followOutput",
      firstItemIndex: "firstItemIndex",
      itemContent: "itemContent",
      fixedHeaderContent: "fixedHeaderContent",
      fixedFooterContent: "fixedFooterContent",
      overscan: "overscan",
      increaseViewportBy: "increaseViewportBy",
      totalCount: "totalCount",
      topItemCount: "topItemCount",
      initialTopMostItemIndex: "initialTopMostItemIndex",
      components: "components",
      groupCounts: "groupCounts",
      atBottomThreshold: "atBottomThreshold",
      atTopThreshold: "atTopThreshold",
      computeItemKey: "computeItemKey",
      defaultItemHeight: "defaultItemHeight",
      fixedItemHeight: "fixedItemHeight",
      itemSize: "itemSize",
      scrollSeekConfiguration: "scrollSeekConfiguration",
      data: "data",
      initialItemCount: "initialItemCount",
      initialScrollTop: "initialScrollTop",
      alignToBottom: "alignToBottom",
      useWindowScroll: "useWindowScroll",
      customScrollParent: "customScrollParent",
      scrollerRef: "scrollerRef",
      logLevel: "logLevel"
    },
    methods: {
      scrollToIndex: "scrollToIndex",
      scrollIntoView: "scrollIntoView",
      scrollTo: "scrollTo",
      scrollBy: "scrollBy",
      getState: "getState"
    },
    events: {
      isScrolling: "isScrolling",
      endReached: "endReached",
      startReached: "startReached",
      rangeChanged: "rangeChanged",
      atBottomStateChange: "atBottomStateChange",
      atTopStateChange: "atTopStateChange",
      totalListHeightChanged: "totalListHeightChanged",
      itemsRendered: "itemsRendered",
      groupIndices: "groupIndices"
    }
  },
  TableRoot
);
const Scroller = /* @__PURE__ */ buildScroller({ usePublisher, useEmitterValue, useEmitter });
const WindowScroller = /* @__PURE__ */ buildWindowScroller({ usePublisher, useEmitterValue, useEmitter });
const TableVirtuoso = Table;









