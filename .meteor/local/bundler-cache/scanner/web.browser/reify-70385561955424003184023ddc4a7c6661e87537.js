module.export({systemToComponent:()=>systemToComponent});let createContext,forwardRef,useState,useImperativeHandle,createElement,useLayoutEffect,useEffect,useCallback,useContext;module.link('react',{createContext(v){createContext=v},forwardRef(v){forwardRef=v},useState(v){useState=v},useImperativeHandle(v){useImperativeHandle=v},createElement(v){createElement=v},useLayoutEffect(v){useLayoutEffect=v},useEffect(v){useEffect=v},useCallback(v){useCallback=v},useContext(v){useContext=v}},0);let tap,init,curry1to0,subscribe,reset,always,publish,eventHandler,curry2to1,getValue;module.link('@virtuoso.dev/urx',{tap(v){tap=v},init(v){init=v},curry1to0(v){curry1to0=v},subscribe(v){subscribe=v},reset(v){reset=v},always(v){always=v},publish(v){publish=v},eventHandler(v){eventHandler=v},curry2to1(v){curry2to1=v},getValue(v){getValue=v}},1);


function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);

  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }

  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var _excluded = ["children"];
/** @internal */

function omit(keys, obj) {
  var result = {};
  var index = {};
  var idx = 0;
  var len = keys.length;

  while (idx < len) {
    index[keys[idx]] = 1;
    idx += 1;
  }

  for (var prop in obj) {
    if (!index.hasOwnProperty(prop)) {
      result[prop] = obj[prop];
    }
  }

  return result;
}

var useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;
/**
 * Converts a system spec to React component by mapping the system streams to component properties, events and methods. Returns hooks for querying and modifying
 * the system streams from the component's child components.
 * @param systemSpec The return value from a [[system]] call.
 * @param map The streams to props / events / methods mapping Check [[SystemPropsMap]] for more details.
 * @param Root The optional React component to render. By default, the resulting component renders nothing, acting as a logical wrapper for its children.
 * @returns an object containing the following:
 *  - `Component`: the React component.
 *  - `useEmitterValue`: a hook that lets child components use values emitted from the specified output stream.
 *  - `useEmitter`: a hook that calls the provided callback whenever the specified stream emits a value.
 *  - `usePublisher`: a hook which lets child components publish values to the specified stream.
 *  <hr />
 */

function systemToComponent(systemSpec, map, Root) {
  var requiredPropNames = Object.keys(map.required || {});
  var optionalPropNames = Object.keys(map.optional || {});
  var methodNames = Object.keys(map.methods || {});
  var eventNames = Object.keys(map.events || {});
  var Context = createContext({});

  function applyPropsToSystem(system, props) {
    if (system['propsReady']) {
      publish(system['propsReady'], false);
    }

    for (var _iterator = _createForOfIteratorHelperLoose(requiredPropNames), _step; !(_step = _iterator()).done;) {
      var requiredPropName = _step.value;
      var stream = system[map.required[requiredPropName]];
      publish(stream, props[requiredPropName]);
    }

    for (var _iterator2 = _createForOfIteratorHelperLoose(optionalPropNames), _step2; !(_step2 = _iterator2()).done;) {
      var optionalPropName = _step2.value;

      if (optionalPropName in props) {
        var _stream = system[map.optional[optionalPropName]];
        publish(_stream, props[optionalPropName]);
      }
    }

    if (system['propsReady']) {
      publish(system['propsReady'], true);
    }
  }

  function buildMethods(system) {
    return methodNames.reduce(function (acc, methodName) {

      acc[methodName] = function (value) {
        var stream = system[map.methods[methodName]];
        publish(stream, value);
      };

      return acc;
    }, {});
  }

  function buildEventHandlers(system) {
    return eventNames.reduce(function (handlers, eventName) {
      handlers[eventName] = eventHandler(system[map.events[eventName]]);
      return handlers;
    }, {});
  }
  /**
   * A React component generated from an urx system
   */


  var Component = forwardRef(function (propsWithChildren, ref) {
    var children = propsWithChildren.children,
        props = _objectWithoutPropertiesLoose(propsWithChildren, _excluded);

    var _useState = useState(function () {
      return tap(init(systemSpec), function (system) {
        return applyPropsToSystem(system, props);
      });
    }),
        system = _useState[0];

    var _useState2 = useState(curry1to0(buildEventHandlers, system)),
        handlers = _useState2[0];

    useIsomorphicLayoutEffect(function () {
      for (var _iterator3 = _createForOfIteratorHelperLoose(eventNames), _step3; !(_step3 = _iterator3()).done;) {
        var eventName = _step3.value;

        if (eventName in props) {
          subscribe(handlers[eventName], props[eventName]);
        }
      }

      return function () {
        Object.values(handlers).map(reset);
      };
    }, [props, handlers, system]);
    useIsomorphicLayoutEffect(function () {
      applyPropsToSystem(system, props);
    });
    useImperativeHandle(ref, always(buildMethods(system)));
    return createElement(Context.Provider, {
      value: system
    }, Root ? createElement(Root, omit([].concat(requiredPropNames, optionalPropNames, eventNames), props), children) : children);
  });

  var usePublisher = function usePublisher(key) {
    return useCallback(curry2to1(publish, useContext(Context)[key]), [key]);
  };
  /**
   * Returns the value emitted from the stream.
   */


  var useEmitterValue = function useEmitterValue(key) {
    var context = useContext(Context);
    var source = context[key];

    var _useState3 = useState(curry1to0(getValue, source)),
        value = _useState3[0],
        setValue = _useState3[1];

    useIsomorphicLayoutEffect(function () {
      return subscribe(source, function (next) {
        if (next !== value) {
          setValue(always(next));
        }
      });
    }, [source, value]);
    return value;
  };

  var useEmitter = function useEmitter(key, callback) {
    var context = useContext(Context);
    var source = context[key];
    useIsomorphicLayoutEffect(function () {
      return subscribe(source, callback);
    }, [callback, source]);
  };

  return {
    Component: Component,
    usePublisher: usePublisher,
    useEmitterValue: useEmitterValue,
    useEmitter: useEmitter
  };
}


//# sourceMappingURL=react-urx.esm.js.map
