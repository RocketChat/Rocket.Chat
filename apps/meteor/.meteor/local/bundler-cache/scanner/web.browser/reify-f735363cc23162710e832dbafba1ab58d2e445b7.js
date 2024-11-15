module.export({Animated:()=>Animated,AnimatedArray:()=>AnimatedArray,AnimatedObject:()=>AnimatedObject,AnimatedString:()=>AnimatedString,AnimatedValue:()=>AnimatedValue,createHost:()=>createHost,getAnimated:()=>getAnimated,getAnimatedType:()=>getAnimatedType,getPayload:()=>getPayload,isAnimated:()=>isAnimated,setAnimated:()=>setAnimated});let defineHidden;module.link("@react-spring/shared",{defineHidden(v){defineHidden=v}},0);let is;module.link("@react-spring/shared",{is(v){is=v}},1);let is2,createInterpolator;module.link("@react-spring/shared",{is(v){is2=v},createInterpolator(v){createInterpolator=v}},2);let isAnimatedString;module.link("@react-spring/shared",{isAnimatedString(v){isAnimatedString=v}},3);let each,eachProp,getFluidValue,hasFluidValue;module.link("@react-spring/shared",{each(v){each=v},eachProp(v){eachProp=v},getFluidValue(v){getFluidValue=v},hasFluidValue(v){hasFluidValue=v}},4);let is3,isAnimatedString2;module.link("@react-spring/shared",{is(v){is3=v},isAnimatedString(v){isAnimatedString2=v}},5);let is5,eachProp2;module.link("@react-spring/shared",{is(v){is5=v},eachProp(v){eachProp2=v}},6);let React;module.link("react",{"*"(v){React=v}},7);let forwardRef,useRef,useCallback,useEffect;module.link("react",{forwardRef(v){forwardRef=v},useRef(v){useRef=v},useCallback(v){useCallback=v},useEffect(v){useEffect=v}},8);let is4,each2,raf,useForceUpdate,useOnce,addFluidObserver,removeFluidObserver,useIsomorphicLayoutEffect;module.link("@react-spring/shared",{is(v){is4=v},each(v){each2=v},raf(v){raf=v},useForceUpdate(v){useForceUpdate=v},useOnce(v){useOnce=v},addFluidObserver(v){addFluidObserver=v},removeFluidObserver(v){removeFluidObserver=v},useIsomorphicLayoutEffect(v){useIsomorphicLayoutEffect=v}},9);// src/Animated.ts

var $node = Symbol.for("Animated:node");
var isAnimated = (value) => !!value && value[$node] === value;
var getAnimated = (owner) => owner && owner[$node];
var setAnimated = (owner, node) => defineHidden(owner, $node, node);
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

var AnimatedValue = class extends Animated {
  constructor(_value) {
    super();
    this._value = _value;
    this.done = true;
    this.durationProgress = 0;
    if (is.num(this._value)) {
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
    if (is.num(value)) {
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
    if (is.num(this._value)) {
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

var AnimatedString = class extends AnimatedValue {
  constructor(value) {
    super(0);
    this._string = null;
    this._toString = createInterpolator({
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
    if (is2.str(value)) {
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
      this._toString = createInterpolator({
        output: [this.getValue(), goal]
      });
    }
    this._value = 0;
    super.reset();
  }
};

// src/AnimatedArray.ts


// src/AnimatedObject.ts







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
    eachProp(this.source, (source, key) => {
      if (isAnimated(source)) {
        values[key] = source.getValue(animated);
      } else if (hasFluidValue(source)) {
        values[key] = getFluidValue(source);
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
      each(this.payload, (node) => node.reset());
    }
  }
  /** Create a payload set. */
  _makePayload(source) {
    if (source) {
      const payload = /* @__PURE__ */ new Set();
      eachProp(source, this._addToPayload, payload);
      return Array.from(payload);
    }
  }
  /** Add to a payload set. */
  _addToPayload(source) {
    if (TreeContext.dependencies && hasFluidValue(source)) {
      TreeContext.dependencies.add(source);
    }
    const payload = getPayload(source);
    if (payload) {
      each(payload, (node) => this.add(node));
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
  const nodeType = isAnimatedString(value) ? AnimatedString : AnimatedValue;
  return nodeType.create(value);
}

// src/getAnimatedType.ts

function getAnimatedType(value) {
  const parentNode = getAnimated(value);
  return parentNode ? parentNode.constructor : is3.arr(value) ? AnimatedArray : isAnimatedString2(value) ? AnimatedString : AnimatedValue;
}

// src/createHost.ts


// src/withAnimated.tsx












var withAnimated = (Component, host) => {
  const hasInstance = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !is4.fun(Component) || Component.prototype && Component.prototype.isReactComponent
  );
  return forwardRef((givenProps, givenRef) => {
    const instanceRef = useRef(null);
    const ref = hasInstance && // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback(
      (value) => {
        instanceRef.current = updateRef(givenRef, value);
      },
      [givenRef]
    );
    const [props, deps] = getAnimatedState(givenProps, host);
    const forceUpdate = useForceUpdate();
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
    const observerRef = useRef();
    useIsomorphicLayoutEffect(() => {
      observerRef.current = observer;
      each2(deps, (dep) => addFluidObserver(dep, observer));
      return () => {
        if (observerRef.current) {
          each2(
            observerRef.current.deps,
            (dep) => removeFluidObserver(dep, observerRef.current)
          );
          raf.cancel(observerRef.current.update);
        }
      };
    });
    useEffect(callback, []);
    useOnce(() => () => {
      const observer2 = observerRef.current;
      each2(observer2.deps, (dep) => removeFluidObserver(dep, observer2));
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
      raf.write(this.update);
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
    if (is4.fun(ref))
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
    if (is5.str(Component)) {
      Component = animated[Component] || (animated[Component] = withAnimated(Component, hostConfig));
    } else {
      Component = Component[cacheKey] || (Component[cacheKey] = withAnimated(Component, hostConfig));
    }
    Component.displayName = `Animated(${displayName})`;
    return Component;
  };
  eachProp2(components, (Component, key) => {
    if (is5.arr(components)) {
      key = getDisplayName(Component);
    }
    animated[key] = animated(Component);
  });
  return {
    animated
  };
};
var getDisplayName = (arg) => is5.str(arg) ? arg : arg && is5.str(arg.displayName) ? arg.displayName : is5.fun(arg) && arg.name || null;













//# sourceMappingURL=react-spring_animated.legacy-esm.js.map