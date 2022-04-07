var inheritsDirectly  = require('./inheritsDirectly');
var isInheritedFrom   = require('./isInheritedFrom');
var isMixinedFrom     = require('./isMixinedFrom');
var defineProperty    = require('./defineProperty');
var setPrototypeOf    = require('./setPrototypeOf');
var getPrototypeOf    = require('./getPrototypeOf');
var createCtor        = require('./createCtor');
var extendPrototype   = require('./extend');

var getOwnPropertyNames = Object.getOwnPropertyNames;
var filterOpts = {
  'all': 0,
  'errSuper': 1,
  'skipSuper': 2
};

/**
 *  A11 -> A1 -> A -> Root
 *  B11 -> B1 -> B -> Root
 *  C11 -> C1 -> C -> Root
 *  mixin B11, C1 : inject C to B11.
 * TODO: Another Implement:
 *   B11 -> B1 -> B -> Root -> mixinCtor_ -> C1_Clone -> C -> Root?
 *
 *  mixin B11, A : inject A to B11.
 *   B11 -> B1 -> B -> Root -> mixinCtor_ -> A_Clone -> C1_Clone -> C -> Root?
 */

/**
 *  Mixin multi classes to ctor.
 *  mixin(Class, ParentClass1, ParentClass2, ...)
 *  + mixinCtors_ array to keep the mixined super ctors
 *  + mixinCtor_ inject to the super_ inheritance chain.
 *  inject into methods to implement inherit.
 *
 *  A11 -> A1 -> A -> Root
 *  B11 -> B1 -> B -> Root
 *  C11 -> C1 -> C -> Root
 *  mixin B11, C : inject C to B11.
 *  clone C.prototype to mixinCtor_.prototype
 *    * all mixined methods/properties are in `mixinCtor_`
 *  for k,method of C.prototype
 *    originalMethod = mixinCtor_.prototype[k]
 *    if isFunction(originalMethod) and originalMethod.__mixin_super__
 *      #B11.__super__ is mixinCtor_.prototype
 *      method  = ->
 *        B11.__super__ = originalMethod.__mixin_super__
 *        method.apply this, arguments
 *        B11.__super__ = mixinCtor_
 *      method.__mixin_super__ = C.prototype
 *  B11 -> mixinCtor_ -> B1 -> B -> Root
 *
mixin the exists method: the new mixin method will oerwrite the old one.

```coffee
class Root
  m: ->
    console.log 'root'
    console.log '----'
class C
  inherits C, Root
  m: ->
    console.log "c"
    super
class B
  inherits B, Root
  m: ->
    console.log "b"
    super
class B11
  inherits B11, B
  m: ->
    console.log 'b11'
    super

b = new B11
b.m()
mixin B11, C
b = new B11
b.m()

# The console results:
# b11
# b
# root
# ----
# b11
# c
# root
# ----

```


 *
 */

/**
 *  check the function body whether call the super
 *
 */
function isSuperInFunction(aMethod) {
  var vStr = aMethod.toString();
  return vStr.indexOf('__super__') >= 0 || /(\s+|^|[;(\[])super[(]|super[.]\S+[(]/.test(vStr);
}
// function isSuperInFunction(aMethod) {
//   return aMethod.toString().indexOf('__super__') >= 0;
// }

// function isES6SuperInFunction(aMethod) {
//   return /(\s+|^|[;(\[])super[(]|super[.]\S+[(]/.test(aMethod.toString());
// }

//TODO: cant use async function. MUST make chain too.
function _mixinGenMethod(aMixinSuper, aMethod, src) {
  var oldSuper = src.__super__;
  return function() {
    // src.__super__ = aMixinSuper;
    console.error('mx', aMixinSuper, 'src', src, 'aMethod', aMethod);
    // var oldvar = getPrototypeOf(this);
    // setPrototypeOf(this, aMixinSuper);
    var result = aMethod.apply(this, arguments);
    // setPrototypeOf(this, oldvar);
    // src.__super__ = oldSuper;
    return result;
  };
}

function _mixinGenMethodES6(aMixinSuper, aMethod, src) {
  var oldSuper = getPrototypeOf(src.prototype);
  return function() {
    setPrototypeOf(src.prototype, aMixinSuper);
    var result = aMethod.apply(this, arguments);
    setPrototypeOf(src.prototype, oldSuper);
    return result;
  };
}

function _getFilterFunc(filter){
  if (!filter) {
    filter = function all(name, value){return value};
  } else if (filter === 1) {
    filter = function raiseErrorOnSuper(name, value) {
      if (typeof value === 'function' && isSuperInFunction(value)) {
        throw new Error(name + ' method: should not use super');
      }
      return value;
    }
  } else if (filter === 2) {
    filter = function skipOnSuper(name, value) {
      if (typeof value !== 'function' || !isSuperInFunction(value)) {
        return value;
      }
    }
  } else if (Array.isArray(filter) && filter.length) {
    var inFilter = filter;
    filter = function allowedInFilter(name, value) {
      if (inFilter.indexOf(name) >= 0) {
        return value;
      }
    }
  } else if (typeof filter !== 'function') {
    throw new Error('filter option value error:' + filter);
  }
  return filter;
}

//clone src(superCtor) to dest(MixinCtor)
function clonePrototype(dest, src, ctor, filter) {
  filter = _getFilterFunc(filter);

  var sp = src.prototype;
  var dp = dest.prototype;
  var names = getOwnPropertyNames(sp);

  for (var i = 0; i < names.length; i++ ) {
    var k = names[i];
    if (k === 'Class' || k === 'constructor') continue;
    var value = filter(k, sp[k]);
    // console.log(k, value)
    if (value !== void 0) dp[k] = value;
    // continue;


    // var method = sp[k];
    // var mixinedMethod = dp[k]; // the method is already clone into mixinCtor_

    // just override the property simply.
    // if (mixinedMethod !== void 0 && typeof mixinedMethod !== 'function') {
    //  // Already be defined as property in the mixin ctor
    //   continue;
    // }

    // if (typeof method === 'function') {
    //   console.log(src, k, getProtoChain(dest.chain))
    //   if (mixinedMethod && mixinedMethod.__mixin_super__) continue;
    //   if (isSuperInFunction(method)) {
    //     console.log('mixined', method)
    //     method = _mixinGenMethod(dest.chain.__super__, method, src);
    //     method.__mixin_super__ = true;
    //   }
    //   dp[k] = method;
    //   continue;

      // if (mixinedMethod && mixinedMethod.__mixin_super__){
      //   if (isSuperInFunction(method)) {
      //     // pass the last mixin super to control the super's parent.
      //     // 但是这将导致代码不会在单一类中流转，不过似乎函数复制过来本来就没有继承关系了。
      //     // A1->A  B1->B C1->C假设 Mixin(B1, [A1,C1]),那么 C1上的方法，本来如果super应该是C
      //     // 但是应为上次方法复制过来的时候指定了 __mixin_super__ 为 A1，就跳到A1上了。
      //     // 不过这个__mixin_super__应该在闭包中，否则会断链。
      //     // 又想到了一招，直接构造新的prototype: 形成双根chain,仅当mixin时用这个chain,
      //     // mixinCtor.chain -> A1CloneCtor -> A1
      //     // mixinCtor.chain -> C1CloneCtor -> A1CloneCtor -> A1
      //     //method = _mixinGenMethod(mixinedMethod.__mixin_super__, method, src);
      //     method = _mixinGenMethod(dest.chain, method, src);

      //   }
      //   else if (isES6SuperInFunction(method)) {
      //     method = _mixinGenMethodES6(mixinedMethod.__mixin_super__, method, src);
      //   }
      // }

      //last mixin_super of this mixined method.
      // method.__mixin_super__ = sp;
    // }
    // dp[k] = method;
  }
}

// function shadowCloneCtor(ctor) {
//   var result = createCtor('Clone__' + ctor.name, '');
//   inheritsDirectly(result, ctor);
//   return result;
// }

// function findLastClonedCtor(ctor) {
//   var result;
//   while (ctor && ctor.name.indexOf('Clone__') === 0) {
//     result = ctor;
//     ctor = ctor.super_;
//   }
//   return result;
// }

var objectSuperCtor = getPrototypeOf(Object);
function mixin(ctor, superCtor, options) {
  var v  = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor); // original superCtor
  var result = false;
  if (!isMixinedFrom(ctor, superCtor) && !isInheritedFrom(ctor, superCtor) && !isInheritedFrom(superCtor, ctor)) {
    var mixinCtor = ctor.mixinCtor_;
    var mixinCtors = ctor.mixinCtors_;
    if (!mixinCtor) {
      mixinCtor = function MixinCtor_(){};
      defineProperty(ctor, 'mixinCtor_', mixinCtor);
      if (v && v !== objectSuperCtor) inheritsDirectly(mixinCtor, v);
      // defineProperty(mixinCtor, 'chain', shadowCloneCtor(superCtor));
      // inheritsDirectly(mixinCtor.chain, shadowCloneCtor(superCtor));
    // } else {
    //   var lastChainCtor = findLastClonedCtor(mixinCtor.chain);
    //   inheritsDirectly(lastChainCtor, shadowCloneCtor(superCtor));
    }
    if (!mixinCtors) {
      mixinCtors = [];
      defineProperty(ctor, 'mixinCtors_', mixinCtors);
    }
    mixinCtors.push(superCtor);//quickly check in isMixinedFrom.
    clonePrototype(mixinCtor, superCtor, ctor, options && options.filter);
    inheritsDirectly(ctor, mixinCtor);
    result = true;
  }
  return result;
}

var mixins = module.exports = function(ctor, superCtors, options) {
  if (typeof superCtors === 'function') return mixin(ctor, superCtors, options);
  for (var i = 0; i < superCtors.length; i++) {
    var superCtor = superCtors[i];
    if (!mixin(ctor, superCtor, options)) return false;
  }
  return true;
};

mixins.filterOpts = filterOpts;
