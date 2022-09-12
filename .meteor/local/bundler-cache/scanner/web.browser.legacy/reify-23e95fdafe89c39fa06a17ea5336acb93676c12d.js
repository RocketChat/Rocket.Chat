'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var urx = require('@virtuoso.dev/urx');

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

var useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect;
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
  var Context = React.createContext({});

  function applyPropsToSystem(system, props) {
    if (system['propsReady']) {
      urx.publish(system['propsReady'], false);
    }

    for (var _iterator = _createForOfIteratorHelperLoose(requiredPropNames), _step; !(_step = _iterator()).done;) {
      var requiredPropName = _step.value;
      var stream = system[map.required[requiredPropName]];
      urx.publish(stream, props[requiredPropName]);
    }

    for (var _iterator2 = _createForOfIteratorHelperLoose(optionalPropNames), _step2; !(_step2 = _iterator2()).done;) {
      var optionalPropName = _step2.value;

      if (optionalPropName in props) {
        var _stream = system[map.optional[optionalPropName]];
        urx.publish(_stream, props[optionalPropName]);
      }
    }

    if (system['propsReady']) {
      urx.publish(system['propsReady'], true);
    }
  }

  function buildMethods(system) {
    return methodNames.reduce(function (acc, methodName) {

      acc[methodName] = function (value) {
        var stream = system[map.methods[methodName]];
        urx.publish(stream, value);
      };

      return acc;
    }, {});
  }

  function buildEventHandlers(system) {
    return eventNames.reduce(function (handlers, eventName) {
      handlers[eventName] = urx.eventHandler(system[map.events[eventName]]);
      return handlers;
    }, {});
  }
  /**
   * A React component generated from an urx system
   */


  var Component = React.forwardRef(function (propsWithChildren, ref) {
    var children = propsWithChildren.children,
        props = _objectWithoutPropertiesLoose(propsWithChildren, _excluded);

    var _useState = React.useState(function () {
      return urx.tap(urx.init(systemSpec), function (system) {
        return applyPropsToSystem(system, props);
      });
    }),
        system = _useState[0];

    var _useState2 = React.useState(urx.curry1to0(buildEventHandlers, system)),
        handlers = _useState2[0];

    useIsomorphicLayoutEffect(function () {
      for (var _iterator3 = _createForOfIteratorHelperLoose(eventNames), _step3; !(_step3 = _iterator3()).done;) {
        var eventName = _step3.value;

        if (eventName in props) {
          urx.subscribe(handlers[eventName], props[eventName]);
        }
      }

      return function () {
        Object.values(handlers).map(urx.reset);
      };
    }, [props, handlers, system]);
    useIsomorphicLayoutEffect(function () {
      applyPropsToSystem(system, props);
    });
    React.useImperativeHandle(ref, urx.always(buildMethods(system)));
    return React.createElement(Context.Provider, {
      value: system
    }, Root ? React.createElement(Root, omit([].concat(requiredPropNames, optionalPropNames, eventNames), props), children) : children);
  });

  var usePublisher = function usePublisher(key) {
    return React.useCallback(urx.curry2to1(urx.publish, React.useContext(Context)[key]), [key]);
  };
  /**
   * Returns the value emitted from the stream.
   */


  var useEmitterValue = function useEmitterValue(key) {
    var context = React.useContext(Context);
    var source = context[key];

    var _useState3 = React.useState(urx.curry1to0(urx.getValue, source)),
        value = _useState3[0],
        setValue = _useState3[1];

    useIsomorphicLayoutEffect(function () {
      return urx.subscribe(source, function (next) {
        if (next !== value) {
          setValue(urx.always(next));
        }
      });
    }, [source, value]);
    return value;
  };

  var useEmitter = function useEmitter(key, callback) {
    var context = React.useContext(Context);
    var source = context[key];
    useIsomorphicLayoutEffect(function () {
      return urx.subscribe(source, callback);
    }, [callback, source]);
  };

  return {
    Component: Component,
    usePublisher: usePublisher,
    useEmitterValue: useEmitterValue,
    useEmitter: useEmitter
  };
}

exports.systemToComponent = systemToComponent;
//# sourceMappingURL=react-urx.cjs.development.js.map
