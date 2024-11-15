"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Animated: () => Animated,
  AnimatedArray: () => AnimatedArray,
  AnimatedObject: () => AnimatedObject,
  AnimatedString: () => AnimatedString,
  AnimatedValue: () => AnimatedValue,
  createHost: () => createHost,
  getAnimated: () => getAnimated,
  getAnimatedType: () => getAnimatedType,
  getPayload: () => getPayload,
  isAnimated: () => isAnimated,
  setAnimated: () => setAnimated
});
module.exports = __toCommonJS(src_exports);

// src/Animated.ts
var import_shared = require("@react-spring/shared");
var $node = Symbol.for("Animated:node");
var isAnimated = (value) => !!value && value[$node] === value;
var getAnimated = (owner) => owner && owner[$node];
var setAnimated = (owner, node) => (0, import_shared.defineHidden)(owner, $node, node);
var getPayload = (owner) => owner && owner[$node] && owner[$node].getPayload();
var Animated = class {
  constructor() {
    setAnimated(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
};

// src/AnimatedValue.ts
var import_shared2 = require("@react-spring/shared");
var AnimatedValue = class extends Animated {
  constructor(_value) {
    super();
    this._value = _value;
    this.done = true;
    this.durationProgress = 0;
    if (import_shared2.is.num(this._value)) {
      this.lastPosition = this._value;
    }
  }
  /** @internal */
  static create(value) {
    return new AnimatedValue(value);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(value, step) {
    if (import_shared2.is.num(value)) {
      this.lastPosition = value;
      if (step) {
        value = Math.round(value / step) * step;
        if (this.done) {
          this.lastPosition = value;
        }
      }
    }
    if (this._value === value) {
      return false;
    }
    this._value = value;
    return true;
  }
  reset() {
    const { done } = this;
    this.done = false;
    if (import_shared2.is.num(this._value)) {
      this.elapsedTime = 0;
      this.durationProgress = 0;
      this.lastPosition = this._value;
      if (done)
        this.lastVelocity = null;
      this.v0 = null;
    }
  }
};

// src/AnimatedString.ts
var import_shared3 = require("@react-spring/shared");
var AnimatedString = class extends AnimatedValue {
  constructor(value) {
    super(0);
    this._string = null;
    this._toString = (0, import_shared3.createInterpolator)({
      output: [value, value]
    });
  }
  /** @internal */
  static create(value) {
    return new AnimatedString(value);
  }
  getValue() {
    const value = this._string;
    return value == null ? this._string = this._toString(this._value) : value;
  }
  setValue(value) {
    if (import_shared3.is.str(value)) {
      if (value == this._string) {
        return false;
      }
      this._string = value;
      this._value = 1;
    } else if (super.setValue(value)) {
      this._string = null;
    } else {
      return false;
    }
    return true;
  }
  reset(goal) {
    if (goal) {
      this._toString = (0, import_shared3.createInterpolator)({
        output: [this.getValue(), goal]
      });
    }
    this._value = 0;
    super.reset();
  }
};

// src/AnimatedArray.ts
var import_shared5 = require("@react-spring/shared");

// src/AnimatedObject.ts
var import_shared4 = require("@react-spring/shared");

// src/context.ts
var TreeContext = { dependencies: null };

// src/AnimatedObject.ts
var AnimatedObject = class extends Animated {
  constructor(source) {
    super();
    this.source = source;
    this.setValue(source);
  }
  getValue(animated) {
    const values = {};
    (0, import_shared4.eachProp)(this.source, (source, key) => {
      if (isAnimated(source)) {
        values[key] = source.getValue(animated);
      } else if ((0, import_shared4.hasFluidValue)(source)) {
        values[key] = (0, import_shared4.getFluidValue)(source);
      } else if (!animated) {
        values[key] = source;
      }
    });
    return values;
  }
  /** Replace the raw object data */
  setValue(source) {
    this.source = source;
    this.payload = this._makePayload(source);
  }
  reset() {
    if (this.payload) {
      (0, import_shared4.each)(this.payload, (node) => node.reset());
    }
  }
  /** Create a payload set. */
  _makePayload(source) {
    if (source) {
      const payload = /* @__PURE__ */ new Set();
      (0, import_shared4.eachProp)(source, this._addToPayload, payload);
      return Array.from(payload);
    }
  }
  /** Add to a payload set. */
  _addToPayload(source) {
    if (TreeContext.dependencies && (0, import_shared4.hasFluidValue)(source)) {
      TreeContext.dependencies.add(source);
    }
    const payload = getPayload(source);
    if (payload) {
      (0, import_shared4.each)(payload, (node) => this.add(node));
    }
  }
};

// src/AnimatedArray.ts
var AnimatedArray = class extends AnimatedObject {
  constructor(source) {
    super(source);
  }
  /** @internal */
  static create(source) {
    return new AnimatedArray(source);
  }
  getValue() {
    return this.source.map((node) => node.getValue());
  }
  setValue(source) {
    const payload = this.getPayload();
    if (source.length == payload.length) {
      return payload.map((node, i) => node.setValue(source[i])).some(Boolean);
    }
    super.setValue(source.map(makeAnimated));
    return true;
  }
};
function makeAnimated(value) {
  const nodeType = (0, import_shared5.isAnimatedString)(value) ? AnimatedString : AnimatedValue;
  return nodeType.create(value);
}

// src/getAnimatedType.ts
var import_shared6 = require("@react-spring/shared");
function getAnimatedType(value) {
  const parentNode = getAnimated(value);
  return parentNode ? parentNode.constructor : import_shared6.is.arr(value) ? AnimatedArray : (0, import_shared6.isAnimatedString)(value) ? AnimatedString : AnimatedValue;
}

// src/createHost.ts
var import_shared8 = require("@react-spring/shared");

// src/withAnimated.tsx
var React = __toESM(require("react"));
var import_react = require("react");
var import_shared7 = require("@react-spring/shared");
var withAnimated = (Component, host) => {
  const hasInstance = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !import_shared7.is.fun(Component) || Component.prototype && Component.prototype.isReactComponent
  );
  return (0, import_react.forwardRef)((givenProps, givenRef) => {
    const instanceRef = (0, import_react.useRef)(null);
    const ref = hasInstance && // eslint-disable-next-line react-hooks/rules-of-hooks
    (0, import_react.useCallback)(
      (value) => {
        instanceRef.current = updateRef(givenRef, value);
      },
      [givenRef]
    );
    const [props, deps] = getAnimatedState(givenProps, host);
    const forceUpdate = (0, import_shared7.useForceUpdate)();
    const callback = () => {
      const instance = instanceRef.current;
      if (hasInstance && !instance) {
        return;
      }
      const didUpdate = instance ? host.applyAnimatedValues(instance, props.getValue(true)) : false;
      if (didUpdate === false) {
        forceUpdate();
      }
    };
    const observer = new PropsObserver(callback, deps);
    const observerRef = (0, import_react.useRef)();
    (0, import_shared7.useIsomorphicLayoutEffect)(() => {
      observerRef.current = observer;
      (0, import_shared7.each)(deps, (dep) => (0, import_shared7.addFluidObserver)(dep, observer));
      return () => {
        if (observerRef.current) {
          (0, import_shared7.each)(
            observerRef.current.deps,
            (dep) => (0, import_shared7.removeFluidObserver)(dep, observerRef.current)
          );
          import_shared7.raf.cancel(observerRef.current.update);
        }
      };
    });
    (0, import_react.useEffect)(callback, []);
    (0, import_shared7.useOnce)(() => () => {
      const observer2 = observerRef.current;
      (0, import_shared7.each)(observer2.deps, (dep) => (0, import_shared7.removeFluidObserver)(dep, observer2));
    });
    const usedProps = host.getComponentProps(props.getValue());
    return /* @__PURE__ */ React.createElement(Component, { ...usedProps, ref });
  });
};
var PropsObserver = class {
  constructor(update, deps) {
    this.update = update;
    this.deps = deps;
  }
  eventObserved(event) {
    if (event.type == "change") {
      import_shared7.raf.write(this.update);
    }
  }
};
function getAnimatedState(props, host) {
  const dependencies = /* @__PURE__ */ new Set();
  TreeContext.dependencies = dependencies;
  if (props.style)
    props = {
      ...props,
      style: host.createAnimatedStyle(props.style)
    };
  props = new AnimatedObject(props);
  TreeContext.dependencies = null;
  return [props, dependencies];
}
function updateRef(ref, value) {
  if (ref) {
    if (import_shared7.is.fun(ref))
      ref(value);
    else
      ref.current = value;
  }
  return value;
}

// src/createHost.ts
var cacheKey = Symbol.for("AnimatedComponent");
var createHost = (components, {
  applyAnimatedValues = () => false,
  createAnimatedStyle = (style) => new AnimatedObject(style),
  getComponentProps = (props) => props
} = {}) => {
  const hostConfig = {
    applyAnimatedValues,
    createAnimatedStyle,
    getComponentProps
  };
  const animated = (Component) => {
    const displayName = getDisplayName(Component) || "Anonymous";
    if (import_shared8.is.str(Component)) {
      Component = animated[Component] || (animated[Component] = withAnimated(Component, hostConfig));
    } else {
      Component = Component[cacheKey] || (Component[cacheKey] = withAnimated(Component, hostConfig));
    }
    Component.displayName = `Animated(${displayName})`;
    return Component;
  };
  (0, import_shared8.eachProp)(components, (Component, key) => {
    if (import_shared8.is.arr(components)) {
      key = getDisplayName(Component);
    }
    animated[key] = animated(Component);
  });
  return {
    animated
  };
};
var getDisplayName = (arg) => import_shared8.is.str(arg) ? arg : arg && import_shared8.is.str(arg.displayName) ? arg.displayName : import_shared8.is.fun(arg) && arg.name || null;
//# sourceMappingURL=react-spring_animated.development.cjs.map