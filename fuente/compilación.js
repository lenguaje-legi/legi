// This file consistently uses `let` keyword instead of `const` for reducing the bundle size.

// Global variables - aliasing some builtin symbols to reduce the bundle size.
let protoOf = Object.getPrototypeOf;
let changedStates, derivedStates, curDeps, curNewDerives, alwaysConnectedDom = {isConnected: 1};
let gcCycleInMs = 1000, statesToGc, propSetterCache = {};
let objProto = protoOf(alwaysConnectedDom), funcProto$2 = protoOf(protoOf), _undefined;

let addAndScheduleOnFirst = (set, s, f, waitMs) =>
  (set ?? (setTimeout(f, waitMs), new Set)).add(s);

let runAndCaptureDeps = (f, deps, arg) => {
  let prevDeps = curDeps;
  curDeps = deps;
  try {
    return f(arg)
  } catch (e) {
    console.error(e);
    return arg
  } finally {
    curDeps = prevDeps;
  }
};

let keepConnected = l => l.filter(b => b._dom?.isConnected);

let addStatesToGc = d => statesToGc = addAndScheduleOnFirst(statesToGc, d, () => {
  for (let s of statesToGc)
    s._bindings = keepConnected(s._bindings),
    s._listeners = keepConnected(s._listeners);
  statesToGc = _undefined;
}, gcCycleInMs);

let stateProto = {
  get val() {
    curDeps?._getters?.add(this);
    return this.rawVal
  },

  get oldVal() {
    curDeps?._getters?.add(this);
    return this._oldVal
  },

  set val(v) {
    curDeps?._setters?.add(this);
    if (v !== this.rawVal) {
      this.rawVal = v;
      this._bindings.length + this._listeners.length ?
        (derivedStates?.add(this), changedStates = addAndScheduleOnFirst(changedStates, this, updateDoms)) :
        this._oldVal = v;
    }
  },
};

let state = initVal => ({
  __proto__: stateProto,
  rawVal: initVal,
  _oldVal: initVal,
  _bindings: [],
  _listeners: [],
});

let bind = (f, dom) => {
  let deps = {_getters: new Set, _setters: new Set}, binding = {f}, prevNewDerives = curNewDerives;
  curNewDerives = [];
  let newDom = runAndCaptureDeps(f, deps, dom);
  newDom = (newDom ?? document).nodeType ? newDom : new Text(newDom);
  for (let d of deps._getters)
    deps._setters.has(d) || (addStatesToGc(d), d._bindings.push(binding));
  for (let l of curNewDerives) l._dom = newDom;
  curNewDerives = prevNewDerives;
  return binding._dom = newDom
};

let derive = (f, s = state(), dom) => {
  let deps = {_getters: new Set, _setters: new Set}, listener = {f, s};
  listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom;
  s.val = runAndCaptureDeps(f, deps, s.rawVal);
  for (let d of deps._getters)
    deps._setters.has(d) || (addStatesToGc(d), d._listeners.push(listener));
  return s
};

let add$3 = (dom, ...children) => {
  for (let c of children.flat(Infinity)) {
    let protoOfC = protoOf(c ?? 0);
    let child = protoOfC === stateProto ? bind(() => c.val) :
      protoOfC === funcProto$2 ? bind(c) : c;
    child != _undefined && dom.append(child);
  }
  return dom
};

let tag = (ns, name, ...args) => {
  let [props, ...children] = protoOf(args[0] ?? 0) === objProto ? args : [{}, ...args];
  let dom = ns ? document.createElementNS(ns, name) : document.createElement(name);
  for (let [k, v] of Object.entries(props)) {
    let getPropDescriptor = proto => proto ?
      Object.getOwnPropertyDescriptor(proto, k) ?? getPropDescriptor(protoOf(proto)) :
      _undefined;
    let cacheKey = name + "," + k;
    let propSetter = propSetterCache[cacheKey] ??
      (propSetterCache[cacheKey] = getPropDescriptor(protoOf(dom))?.set ?? 0);
    let setter = k.startsWith("on") ?
      (v, oldV) => {
        let event = k.slice(2);
        dom.removeEventListener(event, oldV);
        dom.addEventListener(event, v);
      } :
      propSetter ? propSetter.bind(dom) : dom.setAttribute.bind(dom, k);
    let protoOfV = protoOf(v ?? 0);
    k.startsWith("on") || protoOfV === funcProto$2 && (v = derive(v), protoOfV = stateProto);
    protoOfV === stateProto ? bind(() => (setter(v.val, v._oldVal), dom)) : setter(v);
  }
  return add$3(dom, ...children)
};

let handler = ns => ({get: (_, name) => tag.bind(_undefined, ns, name)});
let tags = new Proxy(ns => new Proxy(tag, handler(ns)), handler());

let update = (dom, newDom) => newDom ? newDom !== dom && dom.replaceWith(newDom) : dom.remove();

let updateDoms = () => {
  let iter = 0, derivedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal);
  do {
    derivedStates = new Set;
    for (let l of new Set(derivedStatesArray.flatMap(s => s._listeners = keepConnected(s._listeners))))
      derive(l.f, l.s, l._dom), l._dom = _undefined;
  } while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length)
  let changedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal);
  changedStates = _undefined;
  for (let b of new Set(changedStatesArray.flatMap(s => s._bindings = keepConnected(s._bindings))))
    update(b._dom, bind(b.f, b._dom)), b._dom = _undefined;
  for (let s of changedStatesArray) s._oldVal = s.rawVal;
};

let hydrate = (dom, f) => update(dom, bind(f, dom));

var van = {add: add$3, tags, state, derive, hydrate};

var global$2 = (typeof global !== "undefined" ? global :
            typeof self !== "undefined" ? self :
            typeof window !== "undefined" ? window : {});

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global$2 == 'object' && global$2 && global$2.Object === Object && global$2;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Built-in value references. */
var Symbol = root.Symbol;

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$5.toString;

/** Built-in value references. */
var symToStringTag$1 = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty$4.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto$4.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/** Used as references for various `Number` constants. */
var INFINITY$1 = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/** Used for built-in method references. */
var funcProto$1 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto$3 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$3.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty$3).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$2.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED$1 ? undefined : result;
  }
  return hasOwnProperty$1.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/* Built-in method references that are verified to be native. */
var Map$1 = getNative(root, 'Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map$1 || ListCache),
    'string': new Hash
  };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

/**
 * Casts `array` to a slice if it's needed.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {number} start The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the cast slice.
 */
function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : baseSlice(array, start, end);
}

/** Used to compose unicode character classes. */
var rsAstralRange$1 = '\\ud800-\\udfff',
    rsComboMarksRange$1 = '\\u0300-\\u036f',
    reComboHalfMarksRange$1 = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange$1 = '\\u20d0-\\u20ff',
    rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1,
    rsVarRange$1 = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsZWJ$1 = '\\u200d';

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ$1 + rsAstralRange$1  + rsComboRange$1 + rsVarRange$1 + ']');

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

/**
 * Converts an ASCII `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function asciiToArray(string) {
  return string.split('');
}

/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange + ']',
    rsCombo = '[' + rsComboRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
var reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Converts a Unicode `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return hasUnicode(string)
    ? unicodeToArray(string)
    : asciiToArray(string);
}

/**
 * Creates a function like `_.lowerFirst`.
 *
 * @private
 * @param {string} methodName The name of the `String` case method to use.
 * @returns {Function} Returns the new case function.
 */
function createCaseFirst(methodName) {
  return function(string) {
    string = toString(string);

    var strSymbols = hasUnicode(string)
      ? stringToArray(string)
      : undefined;

    var chr = strSymbols
      ? strSymbols[0]
      : string.charAt(0);

    var trailing = strSymbols
      ? castSlice(strSymbols, 1).join('')
      : string.slice(1);

    return chr[methodName]() + trailing;
  };
}

/**
 * Converts the first character of `string` to upper case.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.upperFirst('fred');
 * // => 'Fred'
 *
 * _.upperFirst('FRED');
 * // => 'FRED'
 */
var upperFirst = createCaseFirst('toUpperCase');

/**
 * Converts the first character of `string` to upper case and the remaining
 * to lower case.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to capitalize.
 * @returns {string} Returns the capitalized string.
 * @example
 *
 * _.capitalize('FRED');
 * // => 'Fred'
 */
function capitalize(string) {
  return upperFirst(toString(string).toLowerCase());
}

/**
 * Converts the first character of `string` to lower case.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.lowerFirst('Fred');
 * // => 'fred'
 *
 * _.lowerFirst('FRED');
 * // => 'fRED'
 */
var lowerFirst = createCaseFirst('toLowerCase');

/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseSet(object, path, value, customizer) {
  if (!isObject(object)) {
    return object;
  }
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = toKey(path[index]),
        newValue = value;

    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return object;
    }

    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = undefined;
      if (newValue === undefined) {
        newValue = isObject(objValue)
          ? objValue
          : (isIndex(path[index + 1]) ? [] : {});
      }
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

/**
 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
 * it's created. Arrays are created for missing index properties while objects
 * are created for all other missing properties. Use `_.setWith` to customize
 * `path` creation.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.set(object, 'a[0].b.c', 4);
 * console.log(object.a[0].b.c);
 * // => 4
 *
 * _.set(object, ['x', '0', 'y', 'z'], 5);
 * console.log(object.x[0].y.z);
 * // => 5
 */
function set(object, path, value) {
  return object == null ? object : baseSet(object, path, value);
}

const { div: div$8, button } = van.tags;

var AgregarTipo = ({ tipo, indicador }) => {
  return div$8(
    button({
      onclick: () => {
        console.log(`Se agregó un tipo: ${tipo}`);

        const propiedades = {
          tipo
        };

        if (tipo === 'Contexto') {
          propiedades.valor = {
            nombre: '',
            tipo: 'Nulo'
          };
        }

        if (tipo === 'Nulo') {
          propiedades.devolver = false;
          propiedades.asignación = '';
          propiedades.contexto = [];
        }

        if (tipo === 'Instancia') {
          propiedades.devolver = false;
          propiedades.asignación = '';
          propiedades.instancia = '';
          propiedades.devuelve = '';
          propiedades.contexto = [];
          propiedades.valor = () => {};
        }

        if (tipo === 'Función') {
          propiedades.devolver = false;
          propiedades.asignación = '';
          propiedades.devuelve = 'Nulo';
          propiedades.contexto = [];
          propiedades.valor = [];
        }

        if (tipo === 'Lista') {
          propiedades.devolver = false;
          propiedades.asignación = '';
          propiedades.valor = [];
        }

        if (tipo === 'Número') {
          propiedades.devolver = false;
          propiedades.asignación = '';
          propiedades.valor = 0;
        }

        if (tipo === 'Texto') {
          propiedades.devolver = false;
          propiedades.asignación = '';
          propiedades.valor = '';
        }

        if (tipo === 'Lógica') {
          propiedades.devolver = false;
          propiedades.asignación = '';
          propiedades.valor = true;
        }

        if (tipo === 'Comentario') {
          propiedades.valor = '';
        }

        const nuevoTipo = get(Código.val, indicador.toSpliced(-1)).toSpliced(indicador.at(-1), 0, propiedades);

        set(Código.val, indicador.toSpliced(-1), nuevoTipo);

        Visualizar();
        EditarPropiedades({ tipo, indicador });
        document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('creado');
        document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado');
        setTimeout(() => {
          document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('seleccionado');
        }, 250);
        setTimeout(() => {
          document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado');
        }, 500);
        setTimeout(() => {
          document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('creado');
        }, 1000);
      }
    }, `Agregar ${lowerFirst(tipo)}`)
  )
};

const visualización$2 = document.querySelector('#visualización');

var ActualizarPropiedad = ({ indicador, valor, target }) => {
  const esLaRaíz = JSON.stringify(indicador) === '[]';

  let Tipo = get(Código.val, indicador);
  if (!Tipo) {
    Tipo = {};
  }

  if (target.value === 'true' || target.value === 'false') {
    if (esLaRaíz) {
      const visualizarLegi = target.value === 'true';
      if (!visualizarLegi) {
        visualización$2.classList.remove('legi');
      }

      if (visualizarLegi) {
        visualización$2.classList.add('legi');
      }
    }

    if (!esLaRaíz) {
      set(
        Código.val,
        JSON.parse(target.dataset.propiedad),
        target.value === 'true'
      );
    }
  }

  if (Tipo.tipo === 'Número' && JSON.parse(target.dataset.propiedad).at(-1) === 'valor') {
    if (target.value.trim() === '' || isNaN(target.value)) {
      target.value = valor;
      return null
    }

    target.value = Number(target.value);
  }

  if (target.value !== 'true' && target.value !== 'false') {
    if (target.tagName !== 'SELECT' && (target.value.trim() === '' || target.value.trim() === valor)) {
      target.value = valor;
      return null
    }

    set(
      Código.val,
      JSON.parse(target.dataset.propiedad),
      target.value
    );
  }

  Visualizar();
  if (!esLaRaíz) {
    document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('editado');
    document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado');
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('seleccionado');
    }, 100);
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.add('seleccionado');
    }, 250);
    setTimeout(() => {
      document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`).classList.remove('editado');
    }, 350);
  }
};

const { p: p$5, div: div$7, input: input$4, span: span$i } = van.tags;

var PropiedadesDeContexto = ({ indicador }) => {
  let valor;
  let confirmado = false;

  const Tipo = get(Código.val, indicador);

  return [
    div$7(
      {
        class: 'propiedad'
      },
      p$5('Nombre'),
      input$4({
        value: Tipo.valor.nombre,
        'data-propiedad': JSON.stringify([...indicador, 'valor', 'nombre']),
        onfocus: ({ target }) => {
          valor = target.value;
          console.log('Se inició un cambio');
        },
        onfocusout: ({ target }) => {
          if (valor === target.value) {
            return
          }
          if (confirmado) {
            confirmado = false;
            return
          }
          console.log('Se aplicó un cambio');
          ActualizarPropiedad({ indicador, valor, target });
        },
        onkeyup: ({ target, key }) => {
          if (key !== undefined && key !== 'Enter') {
            return
          }

          confirmado = true;
          target.blur();
          if (valor === target.value) {
            return
          }
          console.log('Se confirmó un cambio');
          ActualizarPropiedad({ indicador, valor, target });
        }
      })
    ),
    (() => {
      return [
        'Función',
        'Lista',
        'Lógica',
        'Número',
        'Texto',
        'Nulo'
      ].map((tipo) => {
        return div$7(
          {
            class: 'elección'
          },
          input$4({
            type: 'radio',
            name: 'tipo',
            checked: Tipo.valor.tipo === tipo,
            value: tipo,
            'data-propiedad': JSON.stringify([...indicador, 'valor', 'tipo']),
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio');
              ActualizarPropiedad({ indicador, valor, target });
            }
          }),
          span$i({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click();
            }
          }),
          p$5(tipo)
        )
      })
    })()
  ]
};

const { p: p$4, div: div$6, span: span$h, fieldset: fieldset$1, input: input$3 } = van.tags;

var PropiedadesDeLógica = ({ indicador }) => {
  const Tipo = get(Código.val, indicador);

  return div$6(
    {
      class: 'lógica'
    },
    fieldset$1(
      div$6(
        {
          class: 'elección'
        },
        input$3({
          'data-propiedad': JSON.stringify([...indicador, 'valor']),
          type: 'radio',
          name: 'lógica',
          checked: (() => {
            if (Tipo.valor === true) {
              return true
            }
          })(),
          value: true,
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio');
            if (target.checked) {
              target.value = true;
            }
            ActualizarPropiedad({ indicador, target });
          }
        }),
        span$h({
          class: 'marca',
          onclick: ({ target }) => {
            target.parentNode.childNodes[0].click();
          }
        }),
        p$4('Verdadero')
      ),
      div$6(
        {
          class: 'elección'
        },
        input$3({
          'data-propiedad': JSON.stringify([...indicador, 'valor']),
          type: 'radio',
          name: 'lógica',
          checked: (() => {
            if (Tipo.valor === false) {
              return true
            }
          })(),
          value: false,
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio');
            if (target.checked) {
              target.value = false;
            }
            ActualizarPropiedad({ indicador, target });
          }
        }),
        span$h({
          class: 'marca',
          onclick: ({ target }) => {
            target.parentNode.childNodes[0].click();
          }
        }),
        p$4('Falso')
      )
    )
  )
};

var ErrorDeAsignación = ({ indicador }) => {
  const { tipo, asignación, devuelve } = get(Código.val, indicador);
  if (!asignación) {
    return
  }

  const contexto = get(Código.val, JSON.parse(asignación));

  if (contexto) {
    if (tipo === 'Instancia') {
      return contexto.valor.tipo !== devuelve
    }

    return contexto.valor.tipo !== tipo
  }
};

const { div: div$5, select: select$1, option: option$1 } = van.tags;

var PropiedadesDeAsignación = ({ indicador }) => {
  const Tipo = get(Código.val, indicador);
  const { tipo } = Tipo;
  const { contexto } = get(Código.val, indicador.slice(0, -2));

  if (!contexto) {
    return
  }

  let error = '';

  if (ErrorDeAsignación({ indicador })) {
    error = 'error';
  }

  return div$5(
    div$5(
      select$1(
        {
          class: error,
          'data-propiedad': JSON.stringify([...indicador, 'asignación']),
          name: 'asignación',
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio');
            target.classList.remove('error');
            ActualizarPropiedad({ indicador, target });
          }
        },
        option$1(''),
        contexto.map((contexto, indicadorDelContexto) => {
          const valor = JSON.stringify([...indicador.slice(0, -2), 'contexto', indicadorDelContexto]);
          return option$1(
            {
              value: valor,
              selected: (() => {
                return valor === get(Código.val, [...indicador, 'asignación'])
              })(),
              disabled: (() => {
                if (tipo === 'Instancia') {
                  return contexto.valor.tipo !== Tipo.devuelve
                }

                return contexto.valor.tipo !== tipo
              })()
            },
            contexto.valor.nombre
          )
        })
      )
    )
  )
};

const { span: span$g } = van.tags;

var BloqueDeEspacios = ({ bloquesDeEspacios }) => {
  if (bloquesDeEspacios === 0) {
    return null
  }

  return [...Array(bloquesDeEspacios).keys()].map(() => {
    return span$g(
      {
        class: 'bloque-de-espacios'
      },
      '    '
    )
  })
};

const { span: span$f } = van.tags;

var SignoDeDevolver = ({ devolver }) => {
  if (!devolver) {
    devolver = '';
  }

  if (devolver) {
    devolver = 'return ';
  }

  if (!devolver) {
    return null
  }

  return span$f(
    {
      class: 'ruido devolver'
    },
    devolver
  )
};

const { span: span$e } = van.tags;

var SignoDeAsignación = ({ asignación }) => {
  if (!asignación) {
    return null
  }

  return [
    span$e(
      {
        class: 'ruido signo-de-dólar'
      },
      '$'
    ),
    span$e(
      {
        class: 'asignación'
      },
      `${get(Código.val, [...JSON.parse(asignación), 'valor', 'nombre'])}`
    ),
    span$e(
      {
        class: 'signo-de-asignación'
      },
      span$e(
        {
          class: 'ruido'
        },
        ' = '
      )
    )
  ]
};

const { span: span$d } = van.tags;

var SignoDeCierre = ({ indicador }) => {
  const elementoSuperior = get(Código.val, indicador.slice(0, -2));
  let elElementoSuperiorEsUnaLista = false;
  if (elementoSuperior && (elementoSuperior.tipo === 'Lista' || elementoSuperior.tipo === 'Instancia')) {
    elElementoSuperiorEsUnaLista = true;
  }

  if (elElementoSuperiorEsUnaLista) {
    let esElÚltimoElemento = false;
    if (elementoSuperior.tipo !== 'Instancia') {
      const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
        return elemento.tipo !== 'Comentario'
      });

      esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1);
    }

    if (elementoSuperior.tipo === 'Instancia') {
      esElÚltimoElemento = get(Código.val, indicador) === get(Código.val, indicador.slice(0, -2)).contexto.at(-1);
    }

    if (esElÚltimoElemento) {
      return null
    }
    return span$d(
      {
        class: 'ruido coma'
      },
      ','
    )
  }

  return span$d(
    {
      class: 'ruido punto-y-coma'
    },
    ';'
  )
};

const { pre: pre$a, span: span$c, style: style$2 } = van.tags;

var imprimir = () => {
  return {
    devuelve: 'Nulo',
    contexto: [
      {
        tipo: 'Texto',
        nombre: 'texto',
        valor: ''
      }
    ],
    valor: ({ bloquesDeEspacios, indicador }) => {
      const función = get(Código.val, indicador);
      const { contexto } = función;

      const legi = document.querySelector('#visualización').classList.contains('legi');

      return [
        (() => {
          if (legi) {
            return style$2(`
              [data-indicador='${JSON.stringify(indicador)}']
              .instancia::before {
                content: '${'    '.repeat(bloquesDeEspacios - 1)}▶️ imprimir';
                color: #fff;
                margin-left: -${(bloquesDeEspacios - 1) * 2.5}rem;
                filter: hue-rotate(250deg);
              }
            `)
          }
        })(),
        pre$a(
          {
            class: 'instancia'
          },
          pre$a(
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
            SignoDeDevolver(función),
            SignoDeAsignación(función),
            span$c('(function ($texto) {')
          ),
          pre$a(
            {
              style: `margin-left: ${(bloquesDeEspacios - 1) * 2.5}rem;`
            },
            BloqueDeEspacios({ bloquesDeEspacios }),
            span$c('print($texto);')
          ),
          pre$a(
            BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
            span$c('})(...[')
          )
        ),
        (() => {
          return contexto.map((contexto, indicadorDelElemento) => {
            return pre$a(
              {
                style: 'margin-left: 2.5rem;'
              },
              BloqueDeEspacios({ bloquesDeEspacios }),
              span$c(`'${contexto.nombre}'`),
              span$c(
                {
                  class: 'signo-de-asignación'
                },
                span$c(
                  {
                    class: 'ruido'
                  },
                  ' => '
                )
              ),
              Tipo({
                bloquesDeEspacios,
                indicador: [...indicador, 'contexto', indicadorDelElemento],
                valor: contexto.valor
              })
            )
          })
        })(),
        pre$a(
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          span$c('])'),
          SignoDeCierre({ indicador })
        )
      ]
    }
  }
};

const { p: p$3, div: div$4, select, option } = van.tags;

var PropiedadesDeInstancia = ({ indicador }) => {
  const funciones = [
    {
      nombre: 'imprimir',
      ...imprimir()
    }
  ];

  const { instancia } = get(Código.val, indicador);

  if (instancia) {
    const { devuelve } = funciones.find(función => función.nombre === instancia);
    return p$3(devuelve)
  }

  return [
    div$4(
      {
        class: 'propiedad'
      },
      p$3('Función'),
      select(
        {
          'data-propiedad': JSON.stringify([...indicador, 'instancia']),
          name: 'instancia',
          onchange: ({ target }) => {
            console.log('Se confirmó un cambio');
            ActualizarPropiedad({ indicador, target });
            const { instancia } = get(Código.val, indicador);
            const { devuelve, contexto } = funciones.find(función => función.nombre === instancia);
            set(
              Código.val,
              [...indicador, 'devuelve'],
              devuelve
            );
            set(
              Código.val,
              [...indicador, 'contexto'],
              contexto
            );
            Visualizar();
          }
        },
        option(''),
        funciones.map((función) => {
          return option(
            {
              value: función.nombre
            },
            función.nombre
          )
        })
      )
    )
  ]
};

const { p: p$2, div: div$3, input: input$2, span: span$b } = van.tags;

var PropiedadesDeFunción = ({ indicador }) => {
  let valor;

  const Tipo = get(Código.val, indicador);

  return [
    (() => {
      return [
        'Función',
        'Lista',
        'Lógica',
        'Número',
        'Texto',
        'Nulo'
      ].map((tipo) => {
        return div$3(
          {
            class: 'elección'
          },
          input$2({
            type: 'radio',
            name: 'devuelve',
            checked: Tipo.devuelve === tipo,
            value: tipo,
            'data-propiedad': JSON.stringify([...indicador, 'devuelve']),
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio');
              ActualizarPropiedad({ indicador, valor, target });
            }
          }),
          span$b({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click();
            }
          }),
          p$2(tipo)
        )
      })
    })()
  ]
};

const { p: p$1, span: span$a, h2: h2$1, div: div$2, fieldset, input: input$1 } = van.tags;
const visualización$1 = document.querySelector('#visualización');

var Lenguaje = ({ indicador }) => {
  return [
    h2$1(
      {
        class: 'tipo'
      },
      'Visualización'
    ),
    div$2(
      {
        class: 'lógica'
      },
      fieldset(
        div$2(
          {
            class: 'elección'
          },
          input$1({
            type: 'radio',
            name: 'visualización',
            checked: (() => {
              if (visualización$1.classList.contains('legi')) {
                return true
              }
            })(),
            value: true,
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio');
              if (target.checked) {
                target.value = true;
              }
              ActualizarPropiedad({ indicador, target });
            }
          }),
          span$a({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click();
            }
          }),
          p$1('Legi')
        ),
        div$2(
          {
            class: 'elección'
          },
          input$1({
            type: 'radio',
            name: 'visualización',
            checked: (() => {
              if (!visualización$1.classList.contains('legi')) {
                return true
              }
            })(),
            value: false,
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio');
              if (target.checked) {
                target.value = false;
              }
              ActualizarPropiedad({ indicador, target });
            }
          }),
          span$a({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click();
            }
          }),
          p$1('PHP')
        )
      )
    )
  ]
};

const { add: add$2 } = van;
const { p, h2, div: div$1, input, textarea, span: span$9 } = van.tags;

var EditarPropiedades = ({ tipo, indicador } = {}) => {
  const propiedades = document.querySelector('#propiedades');
  propiedades.innerHTML = '';

  let editarPropiedades;

  let Tipo = get(Código.val, indicador);
  if (!Tipo) {
    Tipo = {};
  }

  let últimoElemento = get(Código.val, indicador.slice(0, -1));
  if (últimoElemento) {
    últimoElemento = últimoElemento.at(-1);
  }

  if (!últimoElemento) {
    últimoElemento = {
      devolver: false
    };
  }

  const esLaRaíz = JSON.stringify(indicador) === '[]';
  let esElÚltimoElemento;
  let esLaÚltimaNuevaLínea;

  if (!esLaRaíz && JSON.stringify(indicador) !== '[0]' && JSON.stringify(indicador) !== '[0,"contexto",0]') {
    esElÚltimoElemento = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1) + 1;
    esLaÚltimaNuevaLínea = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1);
  }

  if (tipo === undefined) {
    editarPropiedades = Lenguaje({ indicador });
  }

  if (tipo === 'Nueva línea') {
    if (esLaÚltimaNuevaLínea && últimoElemento.devolver) {
      return null
    }

    if (indicador.slice(0, -1).at(-1) !== 'contexto') {
      editarPropiedades = div$1(
        [
          'Nulo',
          'Instancia',
          'Función',
          'Lista',
          'Número',
          'Texto',
          'Lógica',
          'Comentario'
        ].map(tipo => {
          return AgregarTipo({
            tipo,
            indicador
          })
        })
      );
    }

    if (indicador.slice(0, -1).at(-1) === 'contexto') {
      editarPropiedades = div$1(
        AgregarTipo({
          tipo: 'Contexto',
          indicador
        })
      );
    }
  }

  if (tipo !== undefined && tipo !== 'Nueva línea') {
    editarPropiedades = Object.keys(Tipo).map(propiedad => {
      let valor;
      let confirmado = false;
      const { tipo } = Tipo;

      if (typeof Tipo[propiedad] === 'object' && tipo !== 'Contexto') {
        return null
      }

      if (propiedad === 'tipo') {
        return h2(
          {
            class: 'tipo'
          },
          Tipo[propiedad]
        )
      }

      if (propiedad === 'devolver') {
        if (JSON.stringify(indicador) === '[0]' || !esElÚltimoElemento) {
          return null
        }

        const elementoSuperior = get(Código.val, indicador.slice(0, -2));
        let elElementoSuperiorEsUnaLista = false;
        if (elementoSuperior.tipo === 'Lista') {
          elElementoSuperiorEsUnaLista = true;
        }

        if (elElementoSuperiorEsUnaLista) {
          return null
        }

        return div$1(
          {
            class: 'verificación'
          },
          input({
            'data-propiedad': JSON.stringify([...indicador, propiedad]),
            type: 'checkbox',
            checked: Tipo[propiedad],
            value: Tipo[propiedad],
            onchange: ({ target }) => {
              console.log('Se confirmó un cambio');
              if (target.checked) {
                target.value = true;
              }
              if (!target.checked) {
                target.value = false;
              }
              ActualizarPropiedad({ indicador, valor, propiedad, target });
            }
          }),
          span$9({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click();
            }
          }),
          p(capitalize(propiedad))
        )
      }

      if (tipo === 'Contexto') {
        return PropiedadesDeContexto({ indicador, propiedad })
      }

      if (propiedad === 'asignación') {
        return PropiedadesDeAsignación({ indicador })
      }

      if (tipo === 'Función') {
        return PropiedadesDeFunción({ indicador, propiedad })
      }

      if (propiedad === 'valor' && tipo === 'Instancia') {
        return null
      }

      if (propiedad === 'instancia' && Tipo.instancia === '') {
        return PropiedadesDeInstancia({ indicador, propiedad })
      }

      if (propiedad === 'instancia' && Tipo.instancia !== '') {
        return null
      }

      if (propiedad === 'devuelve' && Tipo.instancia !== '') {
        return PropiedadesDeInstancia({ indicador, propiedad })
      }

      if (propiedad === 'devuelve' && Tipo.instancia === '') {
        return null
      }

      if (tipo === 'Lógica') {
        return PropiedadesDeLógica({ indicador })
      }

      let casilla = input;

      if (tipo === 'Texto' || tipo === 'Comentario') {
        casilla = textarea;
      }

      setTimeout(() => {
        if (tipo === 'Texto' && propiedad === 'valor') {
          const casilla = document.querySelector(`#propiedades [data-propiedad='${JSON.stringify([...indicador, 'valor'])}']`);
          casilla.style.height = '';
          casilla.style.height = `${casilla.scrollHeight}px`;
        }
      }, 0);

      return div$1(
        {
          class: 'propiedad'
        },
        p(capitalize(propiedad)),
        casilla({
          value: Tipo[propiedad],
          'data-propiedad': JSON.stringify([...indicador, propiedad]),
          oninput: ({ target }) => {
            if (tipo === 'Texto' && propiedad === 'valor') {
              target.style.height = '';
              target.style.height = `${target.scrollHeight}px`;
            }
          },
          onfocus: ({ target }) => {
            valor = target.value;
            console.log('Se inició un cambio');
          },
          onfocusout: ({ target }) => {
            if (valor === target.value) {
              return
            }
            if (confirmado) {
              confirmado = false;
              return
            }
            console.log('Se aplicó un cambio');
            ActualizarPropiedad({ indicador, valor, propiedad, target });
          },
          onkeydown: event => {
            if (tipo !== 'Texto' && tipo !== 'Comentario') {
              return
            }

            const { key, shiftKey } = event;
            if (key === 'Enter' && shiftKey) {
              event.preventDefault();
            }
          },
          onkeyup: ({ target, key, shiftKey }) => {
            if ((tipo === 'Texto' || tipo === 'Comentario') && (key === 'Enter' && !shiftKey)) {
              return
            }

            if (key !== undefined && key !== 'Enter') {
              return
            }
            confirmado = true;
            target.blur();
            if (valor === target.value) {
              return
            }
            console.log('Se confirmó un cambio');
            ActualizarPropiedad({ indicador, valor, target });
          }
        })
      )
    });
  }

  add$2(propiedades, editarPropiedades);
};

let selección;

var Seleccionar = ({ click, indicador, tipo }) => {
  click.stopPropagation();
  let elemento;
  if (click.target.classList.contains('Nueva-línea')) {
    elemento = click.target;
  }
  if (!elemento) {
    elemento = document.querySelector(`[data-indicador='${JSON.stringify(indicador)}']`);
  }

  if (selección === elemento) {
    return
  }

  selección = elemento;
  console.log('Se hizo una selección');

  const seleccionado = document.querySelector('.seleccionado');
  if (seleccionado) {
    seleccionado.classList.remove('seleccionado');
  }

  if (!tipo) {
    tipo = get(Código.val, indicador);
  }

  const esLaRaíz = JSON.stringify(indicador) === '[]';

  if (!esLaRaíz) {
    elemento.classList.add('seleccionado');
  }

  EditarPropiedades({ tipo, indicador });
};

const CSS = css => {
  return Object.keys(css).map(selector => {
    return `
        ${selector} {
          ${Object.keys(css[selector]).map(regla => {
            if (typeof css[selector][regla] === 'object') {
              const cssAnidado = {};

              cssAnidado[`&${regla}`] = css[selector][regla];

              return CSS(cssAnidado)
            }
            return `${regla}: ${css[selector][regla]};\n`
          }).join('')}
        }
      `
  }).join('')
};

const { add: add$1 } = van;
const { style: style$1 } = van.tags;

var Estilo = ({ nombre, css }) => {
  const estilo = document.querySelector(`#${nombre}-estilo`);

  if (estilo) {
    return null
  }

  add$1(document.body, style$1(
    {
      id: `${nombre}-estilo`
    },
    CSS(css)
  ));
};

const { pre: pre$9, span: span$8 } = van.tags;

Estilo({
  nombre: 'Nulo',
  css: {
    '#visualización': {

      ' .Nulo': {
        color: 'rgb(150, 100, 255)'
      },

      '.legi': {

        ' .Nulo': {

          ' .valor': {
            color: 'transparent',

            '::before': {
              content: '"👻"',
              color: '#fff'
            }
          }
        }
      }
    }
  }
});

var Nulo = ({ bloquesDeEspacios, indicador, valor }) => {
  const legi = document.querySelector('#visualización').classList.contains('legi');
  const lógica = get(Código.val, indicador);

  return pre$9(
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(lógica),
    SignoDeAsignación(lógica),
    span$8(
      {
        class: `valor${(() => {
          if (legi) {
            return ' nulo'
          }

          return ''
        })()}`
      },
      'null'
    ),
    SignoDeCierre({ indicador })
  )
};

const { pre: pre$8, span: span$7, style } = van.tags;

const instancias = {
  imprimir
};

var Instancia = ({ bloquesDeEspacios, indicador }) => {
  const legi = document.querySelector('#visualización').classList.contains('legi');

  bloquesDeEspacios = bloquesDeEspacios + 1;

  const función = get(Código.val, indicador);
  const { instancia } = función;

  return (() => {
    if (!instancias[instancia]) {
      return [
        (() => {
          if (legi) {
            return style(`
              [data-indicador='${JSON.stringify(indicador)}']
              .ruido {
                margin-left: -0.9rem;
              }
            `)
          }
        })(),
        pre$8(
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          SignoDeDevolver(función),
          SignoDeAsignación(función),
          span$7(
            {
              class: 'ruido'
            },
            '# '
          ),
          span$7('(')
        ),
        pre$8(
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
          span$7(
            {
              class: 'ruido'
            },
            '# '
          ),
          span$7(')'),
          SignoDeCierre({ indicador })
        )
      ]
    }

    return imprimir().valor({ bloquesDeEspacios, indicador })
  })()
};

const { pre: pre$7, span: span$6 } = van.tags;

var Función = ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1;

  const función = get(Código.val, indicador);

  const contexto = función.contexto.map(({ valor }, indicadorDelElemento) => {
    const código = [];
    código.push(Tipo({
      bloquesDeEspacios,
      indicador: [...indicador, 'contexto', indicadorDelElemento],
      valor
    }));

    código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'contexto', indicadorDelElemento + 1] }));

    return código
  });

  const código = función.valor.map(({ valor }, indicadorDelElemento) => {
    const código = [];
    código.push(Tipo({
      bloquesDeEspacios,
      indicador: [...indicador, 'valor', indicadorDelElemento],
      valor
    }));

    código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', indicadorDelElemento + 1] }));

    return código
  });

  return [
    pre$7(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      SignoDeDevolver(función),
      SignoDeAsignación(función),
      span$6(
        {
          class: 'ruido valor función'
        },
        'function'
      )
    ),
    pre$7(
      {
        style: 'margin-left: 2.5rem;'
      },
      BloqueDeEspacios({ bloquesDeEspacios }),
      span$6(
        {
          class: 'contexto'
        },
        span$6(
          {
            class: 'ruido'
          },
          '/* '
        ),
        'contexto ',
        span$6(
          {
            class: 'ruido'
          },
          '*/ '
        )
      ),
      span$6(
        {
          class: 'paréntesis-de-apertura'
        },
        '('
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'contexto', 0] }),
    contexto,
    pre$7(
      BloqueDeEspacios({ bloquesDeEspacios }),
      span$6(
        {
          style: 'margin-left: 2.5rem;',
          class: 'paréntesis-de-cierre'
        },
        ')'
      ),
      span$6(
        {
          class: 'ruido llave'
        },
        ' {'
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    pre$7(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      span$6(
        {
          class: 'ruido llave'
        },
        '}'
      ),
      SignoDeCierre({ indicador })
    )
  ]
};

const { pre: pre$6, span: span$5 } = van.tags;

var Contexto = ({ bloquesDeEspacios, indicador, valor }) => {
  const contexto = get(Código.val, indicador);

  return pre$6(
    BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
    span$5(
      {
        class: 'ruido signo-de-dólar'
      },
      '$'
    ),
    contexto.valor.nombre
  )
};

const { pre: pre$5, span: span$4 } = van.tags;

var Lista = ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1;

  const lista = get(Código.val, indicador);

  const código = lista.valor.map(({ valor }, indicadorDelElemento) => {
    const código = [];
    código.push(Tipo({
      bloquesDeEspacios,
      indicador: [...indicador, 'valor', indicadorDelElemento],
      valor
    }));

    código.push(Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', indicadorDelElemento + 1] }));

    return código
  });

  return [
    pre$5(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      SignoDeDevolver(lista),
      SignoDeAsignación(lista),
      span$4(
        {
          class: 'valor corchete'
        },
        '['
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    pre$5(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios - 1 }),
      span$4(
        {
          class: 'corchete'
        },
        ']'
      ),
      SignoDeCierre({ indicador })
    )
  ]
};

const { pre: pre$4, span: span$3 } = van.tags;

Estilo({
  nombre: 'Lógica',
  css: {
    '#visualización': {

      ' .Lógica': {
        color: 'rgb(255, 150, 100)'
      },

      '.legi': {

        ' .Lógica': {

          ' .valor': {
            color: 'transparent'
          },

          ' .falso': {

            '::before': {
              content: '"❌"',
              color: '#fff'
            }
          },

          ' .verdadero': {

            '::before': {
              content: '"✔️"',
              color: '#fff'
            }
          }
        }
      }
    }
  }
});

var Lógica = ({ bloquesDeEspacios, indicador, valor }) => {
  const lógica = get(Código.val, indicador);

  return pre$4(
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(lógica),
    SignoDeAsignación(lógica),
    span$3(
      {
        class: `valor ${(() => {
          if (valor) {
            return 'verdadero'
          }

          return 'falso'
        })()}`
      },
      valor
    ),
    SignoDeCierre({ indicador })
  )
};

const { pre: pre$3, span: span$2 } = van.tags;

Estilo({
  nombre: 'Número',
  css: {
    '#visualización': {

      ' .Número': {
        color: 'rgb(100, 255, 255)'
      }
    }
  }
});

var Número = ({ bloquesDeEspacios, indicador, valor }) => {
  const número = get(Código.val, indicador);

  return pre$3(
    BloqueDeEspacios({ bloquesDeEspacios }),
    SignoDeDevolver(número),
    SignoDeAsignación(número),
    span$2(
      {
        class: 'valor'
      },
      valor
    ),
    SignoDeCierre({ indicador })
  )
};

const { pre: pre$2, span: span$1 } = van.tags;

Estilo({
  nombre: 'Texto',
  css: {
    '#visualización': {

      ' .Texto': {
        color: 'rgb(255, 255, 100)'
      }
    }
  }
});

var Texto = ({ bloquesDeEspacios, indicador, valor }) => {
  const texto = get(Código.val, indicador);

  return [
    pre$2(
      BloqueDeEspacios({ bloquesDeEspacios }),
      SignoDeDevolver(texto),
      SignoDeAsignación(texto),
      span$1(
        {
          class: 'ruido valor inicio-de-texto'
        },
        '<<<_'
      )
    ),
    (() => {
      if (valor === '' || valor === undefined) {
        return ''
      }

      valor = valor.split('\n').map(valor => {
        return pre$2(
          {
            class: 'texto'
          },
          BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
          valor
        )
      });

      return valor
    })(),
    pre$2(
      BloqueDeEspacios({ bloquesDeEspacios: bloquesDeEspacios + 1 }),
      span$1(
        {
          class: 'ruido final-de-texto'
        },
        '_'
      ),
      SignoDeCierre({ indicador })
    )
  ]
};

const { pre: pre$1, span } = van.tags;

var Comentario = ({ bloquesDeEspacios, valor }) => {
  return valor.split('\n').map(valor => {
    return pre$1(
      BloqueDeEspacios({ bloquesDeEspacios }),
      span(
        {
          class: 'signo-de-número'
        },
        '# '
      ),
      valor
    )
  })
};

const { div } = van.tags;

Estilo({
  nombre: 'Tipo',
  css: {
    '#visualización': {

      '>.Tipo': {
        'border-radius': '0.4rem'
      },

      ' .Tipo': {
        'padding-right': '0.5rem',
        'background-color': 'rgba(0, 0, 0, 0.2)',

        ' .bloque-de-espacios': {
          'margin-left': '-2.5rem'
        },

        ' .Tipo': {
          'margin-left': '2.5rem'
        },

        '.error': {
          'background-color': 'rgba(255, 0, 0, 0.2)'
        }
      }
    }
  }
});

/*

*/

var Tipo = ({ tipo, bloquesDeEspacios, indicador, valor, asignación }) => {
  if (!tipo) {
    tipo = get(Código.val, indicador).tipo;
  }

  if (asignación) {
    valor = `$${asignación} = ${valor}`;
  }

  if (tipo === 'Nulo') {
    valor = Nulo({ bloquesDeEspacios, indicador });
  }

  if (tipo === 'Instancia') {
    valor = Instancia({ bloquesDeEspacios, indicador });
  }

  if (tipo === 'Función') {
    valor = Función({ bloquesDeEspacios, indicador, valor });
  }

  if (tipo === 'Contexto') {
    valor = Contexto({ bloquesDeEspacios, indicador, valor });
  }

  if (tipo === 'Lista') {
    valor = Lista({ bloquesDeEspacios, indicador });
  }

  if (tipo === 'Lógica') {
    valor = Lógica({ bloquesDeEspacios, indicador, valor });
  }

  if (tipo === 'Número') {
    valor = Número({ bloquesDeEspacios, indicador, valor });
  }

  if (tipo === 'Texto') {
    valor = Texto({ bloquesDeEspacios, indicador, valor });
  }

  if (tipo === 'Comentario') {
    valor = Comentario({ bloquesDeEspacios, valor });
  }

  let error = '';

  if (tipo !== 'Nueva línea' && ErrorDeAsignación({ indicador })) {
    error = 'error ';
  }

  return div(
    {
      'data-indicador': (() => {
        if (tipo === 'Nueva línea') {
          return ''
        }
        return JSON.stringify(indicador)
      })(),
      class: `${error}Tipo ${tipo.replaceAll(' ', '-')}`,
      onclick: (click) => {
        Seleccionar({ click, indicador, tipo });
      }
    },
    valor
  )
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var json2php$1 = {exports: {}};

(function (module) {
	// Generated by CoffeeScript 2.7.0
	var json2php, make,
	  hasProp = {}.hasOwnProperty;

	make = function({linebreak = '', indent = '', shortArraySyntax = false, stripSpaces = false} = {}) {
	  var arrClose, arrOpen, nest, transform;
	  arrOpen = shortArraySyntax ? '[' : 'array(';
	  arrClose = shortArraySyntax ? ']' : ')';
	  nest = {
	    '[object Array]': function(obj, parentIndent) {
	      var i, len, results, value;
	      results = [];
	      for (i = 0, len = obj.length; i < len; i++) {
	        value = obj[i];
	        results.push(transform(value, parentIndent));
	      }
	      return results;
	    },
	    '[object Object]': function(obj, parentIndent) {
	      var key, results, value;
	      results = [];
	      for (key in obj) {
	        if (!hasProp.call(obj, key)) continue;
	        value = obj[key];
	        results.push(transform(key, parentIndent) + (stripSpaces ? '=>' : ' => ') + transform(value, parentIndent));
	      }
	      return results;
	    }
	  };
	  return transform = function(obj, parentIndent = '') {
	    var items, nestIndent, objType, result;
	    objType = Object.prototype.toString.call(obj);
	    switch (objType) {
	      case '[object Null]':
	      case '[object Undefined]':
	        result = 'null';
	        break;
	      case '[object String]':
	        result = "'" + obj.replace(/\\/g, '\\\\').replace(/\'/g, "\\'") + "'";
	        break;
	      case '[object Number]':
	      case '[object Boolean]':
	        result = obj.toString();
	        break;
	      case '[object Array]':
	      case '[object Object]':
	        nestIndent = parentIndent + indent;
	        items = nest[objType](obj, nestIndent);
	        result = `${arrOpen}${linebreak + nestIndent}${items.join(',' + (linebreak === '' && !stripSpaces ? ' ' : linebreak + nestIndent))}${linebreak + parentIndent}${arrClose}`;
	        break;
	      default:
	        result = 'null';
	    }
	    return result;
	  };
	};

	json2php = make();

	json2php.make = make;

	if (module.exports) {
	  module.exports = json2php;
	  // Not that good but useful
	  commonjsGlobal.json2php = json2php;
	} 
} (json2php$1));

var json2phpExports = json2php$1.exports;
var json2php = /*@__PURE__*/getDefaultExportFromCjs(json2phpExports);

const { add } = van;

var Visualizar = () => {
  const visualización = document.querySelector('#visualización');
  visualización.innerHTML = '';
  add(visualización, Tipo({
    bloquesDeEspacios: 0,
    indicador: [0]
  }));

  const salida = document.querySelector('#salida');
  salida.innerHTML = '';
  document.querySelector('#visualización').classList.add('salida');
  salida.innerText = `<?php\n\n${json2php.make({
    linebreak: '\n',
    indent: '    ',
    shortArraySyntax: true
  })(Código.val)};\n\n${visualización.innerText}\n`;
  document.querySelector('#visualización').classList.remove('salida');
};

var src = {exports: {}};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var attribute$1 = {
  attributeIndex: 0,
  attributeListDepth: {},
  matchST_ATTRIBUTE: function () {
    let ch = this.input();
    if (this.is_WHITESPACE()) {
      do {
        ch = this.input();
      } while (this.is_WHITESPACE());
      this.unput(1);
      return null;
    }
    switch (ch) {
      case "]":
        if (this.attributeListDepth[this.attributeIndex] === 0) {
          delete this.attributeListDepth[this.attributeIndex];
          this.attributeIndex--;
          this.popState();
        } else {
          /* istanbul ignore next */
          this.attributeListDepth[this.attributeIndex]--;
        }
        return "]";
      case "(":
      case ")":
      case ":":
      case "=":
      case "|":
      case "&":
      case "^":
      case "-":
      case "+":
      case "*":
      case "%":
      case "~":
      case "<":
      case ">":
      case "!":
      case ".":
        return this.consume_TOKEN();
      case "[":
        this.attributeListDepth[this.attributeIndex]++;
        return "[";
      case ",":
        return ",";
      case '"':
        return this.ST_DOUBLE_QUOTES();
      case "'":
        return this.T_CONSTANT_ENCAPSED_STRING();
      case "/":
        if (this._input[this.offset] === "/") {
          return this.T_COMMENT();
        } else if (this._input[this.offset] === "*") {
          this.input();
          return this.T_DOC_COMMENT();
        } else {
          return this.consume_TOKEN();
        }
    }
    if (this.is_LABEL_START() || ch === "\\") {
      while (this.offset < this.size) {
        const ch = this.input();
        if (!(this.is_LABEL() || ch === "\\")) {
          if (ch) this.unput(1);
          break;
        }
      }
      return this.T_STRING();
    } else if (this.is_NUM()) {
      return this.consume_NUM();
    }

    /* istanbul ignore next */
    throw new Error(
      `Bad terminal sequence "${ch}" at line ${this.yylineno} (offset ${this.offset})`
    );
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var comments = {
  /*
   * Reads a single line comment
   */
  T_COMMENT: function () {
    while (this.offset < this.size) {
      const ch = this.input();
      if (ch === "\n" || ch === "\r") {
        return this.tok.T_COMMENT;
      } else if (
        ch === "?" &&
        !this.aspTagMode &&
        this._input[this.offset] === ">"
      ) {
        this.unput(1);
        return this.tok.T_COMMENT;
      } else if (
        ch === "%" &&
        this.aspTagMode &&
        this._input[this.offset] === ">"
      ) {
        this.unput(1);
        return this.tok.T_COMMENT;
      }
    }
    return this.tok.T_COMMENT;
  },
  /*
   * Behaviour : https://github.com/php/php-src/blob/master/Zend/zend_language_scanner.l#L1927
   */
  T_DOC_COMMENT: function () {
    let ch = this.input();
    let token = this.tok.T_COMMENT;
    if (ch === "*") {
      // started with '/*' , check is next is '*'
      ch = this.input();
      if (this.is_WHITESPACE()) {
        // check if next is WHITESPACE
        token = this.tok.T_DOC_COMMENT;
      }
      if (ch === "/") {
        return token;
      } else {
        this.unput(1); // reset
      }
    }
    while (this.offset < this.size) {
      ch = this.input();
      if (ch === "*" && this._input[this.offset] === "/") {
        this.input();
        break;
      }
    }
    return token;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var initial = {
  nextINITIAL: function () {
    if (
      this.conditionStack.length > 1 &&
      this.conditionStack[this.conditionStack.length - 1] === "INITIAL"
    ) {
      // Return to HEREDOC/ST_DOUBLE_QUOTES mode
      this.popState();
    } else {
      this.begin("ST_IN_SCRIPTING");
    }
    return this;
  },
  matchINITIAL: function () {
    while (this.offset < this.size) {
      let ch = this.input();
      if (ch == "<") {
        ch = this.ahead(1);
        if (ch == "?") {
          if (this.tryMatch("?=")) {
            this.unput(1)
              .appendToken(this.tok.T_OPEN_TAG_WITH_ECHO, 3)
              .nextINITIAL();
            break;
          } else if (this.tryMatchCaseless("?php")) {
            ch = this._input[this.offset + 4];
            if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
              this.unput(1).appendToken(this.tok.T_OPEN_TAG, 6).nextINITIAL();
              break;
            }
          }
          if (this.short_tags) {
            this.unput(1).appendToken(this.tok.T_OPEN_TAG, 2).nextINITIAL();
            break;
          }
        } else if (this.asp_tags && ch == "%") {
          if (this.tryMatch("%=")) {
            this.aspTagMode = true;
            this.unput(1)
              .appendToken(this.tok.T_OPEN_TAG_WITH_ECHO, 3)
              .nextINITIAL();
            break;
          } else {
            this.aspTagMode = true;
            this.unput(1).appendToken(this.tok.T_OPEN_TAG, 2).nextINITIAL();
            break;
          }
        }
      }
    }
    if (this.yytext.length > 0) {
      return this.tok.T_INLINE_HTML;
    } else {
      return false;
    }
  },
};

// shim for using process in browser
// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
if (typeof global$2.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
}
if (typeof global$2.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
}

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
}
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title = 'browser';
var platform = 'browser';
var browser = true;
var env = {};
var argv = [];
var version = ''; // empty string to avoid regexp issues
var versions = {};
var release = {};
var config = {};

function noop$1() {}

var on = noop$1;
var addListener = noop$1;
var once = noop$1;
var off = noop$1;
var removeListener = noop$1;
var removeAllListeners = noop$1;
var emit = noop$1;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance = global$2.performance || {};
var performanceNow =
  performance.now        ||
  performance.mozNow     ||
  performance.msNow      ||
  performance.oNow       ||
  performance.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1000;
}

var process = {
  nextTick: nextTick,
  title: title,
  browser: browser,
  env: env,
  argv: argv,
  version: version,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit,
  binding: binding,
  cwd: cwd,
  chdir: chdir,
  umask: umask,
  hrtime: hrtime,
  platform: platform,
  release: release,
  config: config,
  uptime: uptime
};

/* istanbul ignore else  */
let MAX_LENGTH_OF_LONG = 10;
let long_min_digits = "2147483648";
if (process.arch == "x64") {
  MAX_LENGTH_OF_LONG = 19;
  long_min_digits = "9223372036854775808";
}

var numbers = {
  consume_NUM: function () {
    let ch = this.yytext[0];
    let hasPoint = ch === ".";
    if (ch === "0") {
      ch = this.input();
      // check if hexa
      if (ch === "x" || ch === "X") {
        ch = this.input();
        if (ch !== "_" && this.is_HEX()) {
          return this.consume_HNUM();
        } else {
          this.unput(ch ? 2 : 1);
        }
        // check binary notation
      } else if (ch === "b" || ch === "B") {
        ch = this.input();
        if ((ch !== "_" && ch === "0") || ch === "1") {
          return this.consume_BNUM();
        } else {
          this.unput(ch ? 2 : 1);
        }
      } else if (ch === "o" || ch === "O") {
        ch = this.input();
        if (ch !== "_" && this.is_OCTAL()) {
          return this.consume_ONUM();
        } else {
          this.unput(ch ? 2 : 1);
        }
      } else if (!this.is_NUM()) {
        if (ch) this.unput(1);
      }
    }

    while (this.offset < this.size) {
      const prev = ch;
      ch = this.input();

      if (ch === "_") {
        if (prev === "_") {
          // restriction : next to underscore / 1__1;
          this.unput(2); // keep 1
          break;
        }
        if (prev === ".") {
          // next to decimal point  "1._0"
          this.unput(1); // keep 1.
          break;
        }
        if (prev === "e" || prev === "E") {
          // next to e "1e_10"
          this.unput(2); // keep 1
          break;
        }
      } else if (ch === ".") {
        if (hasPoint) {
          // no multiple points "1.0.5"
          this.unput(1); // keep 1.0
          break;
        }
        if (prev === "_") {
          // next to decimal point  "1_.0"
          this.unput(2); // keep 1
          break;
        }
        hasPoint = true;
        continue;
      } else if (ch === "e" || ch === "E") {
        if (prev === "_") {
          // next to e "1_e10"
          this.unput(1);
          break;
        }
        let undo = 2;
        ch = this.input();
        if (ch === "+" || ch === "-") {
          // 1e-5
          undo = 3;
          ch = this.input();
        }
        if (this.is_NUM_START()) {
          this.consume_LNUM();
          return this.tok.T_DNUMBER;
        }
        this.unput(ch ? undo : undo - 1); // keep only 1
        break;
      }

      if (!this.is_NUM()) {
        // example : 10.0a
        if (ch) this.unput(1); // keep 10.0
        break;
      }
    }

    if (hasPoint) {
      return this.tok.T_DNUMBER;
    } else if (this.yytext.length < MAX_LENGTH_OF_LONG - 1) {
      return this.tok.T_LNUMBER;
    } else {
      if (
        this.yytext.length < MAX_LENGTH_OF_LONG ||
        (this.yytext.length == MAX_LENGTH_OF_LONG &&
          this.yytext < long_min_digits)
      ) {
        return this.tok.T_LNUMBER;
      }
      return this.tok.T_DNUMBER;
    }
  },
  // read hexa
  consume_HNUM: function () {
    while (this.offset < this.size) {
      const ch = this.input();
      if (!this.is_HEX()) {
        if (ch) this.unput(1);
        break;
      }
    }
    return this.tok.T_LNUMBER;
  },
  // read a generic number
  consume_LNUM: function () {
    while (this.offset < this.size) {
      const ch = this.input();
      if (!this.is_NUM()) {
        if (ch) this.unput(1);
        break;
      }
    }
    return this.tok.T_LNUMBER;
  },
  // read binary
  consume_BNUM: function () {
    let ch;
    while (this.offset < this.size) {
      ch = this.input();
      if (ch !== "0" && ch !== "1" && ch !== "_") {
        if (ch) this.unput(1);
        break;
      }
    }
    return this.tok.T_LNUMBER;
  },
  // read an octal number
  consume_ONUM: function () {
    while (this.offset < this.size) {
      const ch = this.input();
      if (!this.is_OCTAL()) {
        if (ch) this.unput(1);
        break;
      }
    }
    return this.tok.T_LNUMBER;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var property$1 = {
  matchST_LOOKING_FOR_PROPERTY: function () {
    let ch = this.input();
    if (ch === "-") {
      ch = this.input();
      if (ch === ">") {
        // https://github.com/php/php-src/blob/master/Zend/zend_language_scanner.l#L1296
        return this.tok.T_OBJECT_OPERATOR;
      }
      if (ch) this.unput(1);
    } else if (this.is_WHITESPACE()) {
      return this.tok.T_WHITESPACE;
    } else if (this.is_LABEL_START()) {
      // https://github.com/php/php-src/blob/master/Zend/zend_language_scanner.l#L1300
      this.consume_LABEL();
      this.popState();
      return this.tok.T_STRING;
    }
    // https://github.com/php/php-src/blob/master/Zend/zend_language_scanner.l#L1306
    this.popState();
    if (ch) this.unput(1);
    return false;
  },
  matchST_LOOKING_FOR_VARNAME: function () {
    let ch = this.input();

    // SHIFT STATE
    this.popState();
    this.begin("ST_IN_SCRIPTING");

    if (this.is_LABEL_START()) {
      this.consume_LABEL();
      ch = this.input();
      if (ch === "[" || ch === "}") {
        this.unput(1);
        return this.tok.T_STRING_VARNAME;
      } else {
        // any char (that's started with a label sequence)
        this.unput(this.yytext.length);
      }
    } else {
      // any char (thats not a label start sequence)
      if (ch) this.unput(1);
    }
    // stops looking for a varname and starts the scripting mode
    return false;
  },
  matchST_VAR_OFFSET: function () {
    const ch = this.input();
    if (this.is_NUM_START()) {
      this.consume_NUM();
      return this.tok.T_NUM_STRING;
    } else if (ch === "]") {
      this.popState();
      return "]";
    } else if (ch === "$") {
      this.input();
      if (this.is_LABEL_START()) {
        this.consume_LABEL();
        return this.tok.T_VARIABLE;
      } else {
        /* istanbul ignore next */
        throw new Error("Unexpected terminal");
      }
    } else if (this.is_LABEL_START()) {
      this.consume_LABEL();
      return this.tok.T_STRING;
    } else if (
      this.is_WHITESPACE() ||
      ch === "\\" ||
      ch === "'" ||
      ch === "#"
    ) {
      return this.tok.T_ENCAPSED_AND_WHITESPACE;
    } else if (
      ch === "[" ||
      ch === "{" ||
      ch === "}" ||
      ch === '"' ||
      ch === "`" ||
      this.is_TOKEN()
    ) {
      return ch;
    } else {
      /* istanbul ignore next */
      throw new Error("Unexpected terminal");
    }
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var scripting = {
  matchST_IN_SCRIPTING: function () {
    let ch = this.input();
    switch (ch) {
      case " ":
      case "\t":
      case "\n":
      case "\r":
      case "\r\n":
        return this.T_WHITESPACE();
      case "#":
        if (this.version >= 800 && this._input[this.offset] === "[") {
          this.input();
          this.attributeListDepth[++this.attributeIndex] = 0;
          this.begin("ST_ATTRIBUTE");
          return this.tok.T_ATTRIBUTE;
        }
        return this.T_COMMENT();
      case "/":
        if (this._input[this.offset] === "/") {
          return this.T_COMMENT();
        } else if (this._input[this.offset] === "*") {
          this.input();
          return this.T_DOC_COMMENT();
        }
        return this.consume_TOKEN();
      case "'":
        return this.T_CONSTANT_ENCAPSED_STRING();
      case '"':
        return this.ST_DOUBLE_QUOTES();
      case "`":
        this.begin("ST_BACKQUOTE");
        return "`";
      case "?":
        if (!this.aspTagMode && this.tryMatch(">")) {
          this.input();
          const nextCH = this._input[this.offset];
          if (nextCH === "\n" || nextCH === "\r") this.input();
          if (this.conditionStack.length > 1) {
            this.begin("INITIAL");
          }
          return this.tok.T_CLOSE_TAG;
        }
        return this.consume_TOKEN();
      case "%":
        if (this.aspTagMode && this._input[this.offset] === ">") {
          this.input(); // consume the '>'
          ch = this._input[this.offset]; // read next
          if (ch === "\n" || ch === "\r") {
            this.input(); // consume the newline
          }
          this.aspTagMode = false;
          if (this.conditionStack.length > 1) {
            this.begin("INITIAL");
          }
          return this.tok.T_CLOSE_TAG;
        }
        return this.consume_TOKEN();
      case "{":
        this.begin("ST_IN_SCRIPTING");
        return "{";
      case "}":
        if (this.conditionStack.length > 2) {
          // Return to HEREDOC/ST_DOUBLE_QUOTES mode
          this.popState();
        }
        return "}";
      default:
        if (ch === ".") {
          ch = this.input();
          if (this.is_NUM_START()) {
            return this.consume_NUM();
          } else {
            if (ch) this.unput(1);
          }
        }
        if (this.is_NUM_START()) {
          return this.consume_NUM();
        } else if (this.is_LABEL_START()) {
          return this.consume_LABEL().T_STRING();
        } else if (this.is_TOKEN()) {
          return this.consume_TOKEN();
        }
    }
    throw new Error(
      'Bad terminal sequence "' +
        ch +
        '" at line ' +
        this.yylineno +
        " (offset " +
        this.offset +
        ")"
    );
  },

  T_WHITESPACE: function () {
    while (this.offset < this.size) {
      const ch = this.input();
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        continue;
      }
      if (ch) this.unput(1);
      break;
    }
    return this.tok.T_WHITESPACE;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const newline = ["\n", "\r"];
const valid_after_heredoc = ["\n", "\r", ";"];
const valid_after_heredoc_73 = valid_after_heredoc.concat([
  "\t",
  " ",
  ",",
  "]",
  ")",
  "/",
  "=",
  "!",
]);

var strings = {
  T_CONSTANT_ENCAPSED_STRING: function () {
    let ch;
    while (this.offset < this.size) {
      ch = this.input();
      if (ch == "\\") {
        this.input();
      } else if (ch == "'") {
        break;
      }
    }
    return this.tok.T_CONSTANT_ENCAPSED_STRING;
  },
  // check if matching a HEREDOC state
  is_HEREDOC: function () {
    const revert = this.offset;
    if (
      this._input[this.offset - 1] === "<" &&
      this._input[this.offset] === "<" &&
      this._input[this.offset + 1] === "<"
    ) {
      this.offset += 3;

      // optional tabs / spaces
      if (this.is_TABSPACE()) {
        while (this.offset < this.size) {
          this.offset++;
          if (!this.is_TABSPACE()) {
            break;
          }
        }
      }

      // optional quotes
      let tChar = this._input[this.offset - 1];
      if (tChar === "'" || tChar === '"') {
        this.offset++;
      } else {
        tChar = null;
      }

      // required label
      if (this.is_LABEL_START()) {
        let yyoffset = this.offset - 1;
        while (this.offset < this.size) {
          this.offset++;
          if (!this.is_LABEL()) {
            break;
          }
        }
        const yylabel = this._input.substring(yyoffset, this.offset - 1);
        if (!tChar || tChar === this._input[this.offset - 1]) {
          // required ending quote
          if (tChar) this.offset++;
          // require newline
          if (newline.includes(this._input[this.offset - 1])) {
            // go go go
            this.heredoc_label.label = yylabel;
            this.heredoc_label.length = yylabel.length;
            this.heredoc_label.finished = false;
            yyoffset = this.offset - revert;
            this.offset = revert;
            this.consume(yyoffset);
            if (tChar === "'") {
              this.begin("ST_NOWDOC");
            } else {
              this.begin("ST_HEREDOC");
            }
            // prematch to get the indentation information from end of doc
            this.prematch_ENDOFDOC();
            return this.tok.T_START_HEREDOC;
          }
        }
      }
    }
    this.offset = revert;
    return false;
  },
  ST_DOUBLE_QUOTES: function () {
    let ch;
    while (this.offset < this.size) {
      ch = this.input();
      if (ch == "\\") {
        this.input();
      } else if (ch == '"') {
        break;
      } else if (ch == "$") {
        ch = this.input();
        if (ch == "{" || this.is_LABEL_START()) {
          this.unput(2);
          break;
        }
        if (ch) this.unput(1);
      } else if (ch == "{") {
        ch = this.input();
        if (ch == "$") {
          this.unput(2);
          break;
        }
        if (ch) this.unput(1);
      }
    }
    if (ch == '"') {
      return this.tok.T_CONSTANT_ENCAPSED_STRING;
    } else {
      let prefix = 1;
      if (this.yytext[0] === "b" || this.yytext[0] === "B") {
        prefix = 2;
      }
      if (this.yytext.length > 2) {
        this.appendToken(
          this.tok.T_ENCAPSED_AND_WHITESPACE,
          this.yytext.length - prefix
        );
      }
      this.unput(this.yytext.length - prefix);
      this.begin("ST_DOUBLE_QUOTES");
      return this.yytext;
    }
  },

  // check if its a DOC end sequence
  isDOC_MATCH: function (offset, consumeLeadingSpaces) {
    // @fixme : check if out of text limits

    // consumeLeadingSpaces is false happen DOC prematch END HEREDOC stage.

    // Ensure current state is really after a new line break, not after a such as ${variables}
    const prev_ch = this._input[offset - 2];
    if (!newline.includes(prev_ch)) {
      return false;
    }

    // skip leading spaces or tabs
    let indentation_uses_spaces = false;
    let indentation_uses_tabs = false;
    // reset heredoc_label structure
    let indentation = 0;
    let leading_ch = this._input[offset - 1];

    if (this.version >= 703) {
      while (leading_ch === "\t" || leading_ch === " ") {
        if (leading_ch === " ") {
          indentation_uses_spaces = true;
        } else if (leading_ch === "\t") {
          indentation_uses_tabs = true;
        }

        leading_ch = this._input[offset + indentation];
        indentation++;
      }

      // Move offset to skip leading whitespace
      offset = offset + indentation;

      // return out if there was only whitespace on this line
      if (newline.includes(this._input[offset - 1])) {
        return false;
      }
    }

    if (
      this._input.substring(
        offset - 1,
        offset - 1 + this.heredoc_label.length
      ) === this.heredoc_label.label
    ) {
      const ch = this._input[offset - 1 + this.heredoc_label.length];
      if (
        (this.version >= 703
          ? valid_after_heredoc_73
          : valid_after_heredoc
        ).includes(ch)
      ) {
        if (consumeLeadingSpaces) {
          this.consume(indentation);
          // https://wiki.php.net/rfc/flexible_heredoc_nowdoc_syntaxes
          if (indentation_uses_spaces && indentation_uses_tabs) {
            throw new Error(
              "Parse error:  mixing spaces and tabs in ending marker at line " +
                this.yylineno +
                " (offset " +
                this.offset +
                ")"
            );
          }
        } else {
          // Called in prematch_ENDOFDOC
          this.heredoc_label.indentation = indentation;
          this.heredoc_label.indentation_uses_spaces = indentation_uses_spaces;
          this.heredoc_label.first_encaps_node = true;
        }
        return true;
      }
    }

    return false;
  },

  /*
   * Prematch the end of HEREDOC/NOWDOC end tag to preset the
   * context of this.heredoc_label
   */
  prematch_ENDOFDOC: function () {
    // reset heredoc
    this.heredoc_label.indentation_uses_spaces = false;
    this.heredoc_label.indentation = 0;
    this.heredoc_label.first_encaps_node = true;
    let offset = this.offset + 1;

    while (offset < this._input.length) {
      // if match heredoc_label structrue will be set
      if (this.isDOC_MATCH(offset, false)) {
        return;
      }

      if (!newline.includes(this._input[offset - 1])) {
        // skip one line
        while (
          !newline.includes(this._input[offset++]) &&
          offset < this._input.length
        ) {
          // skip
        }
      }

      offset++;
    }
  },

  matchST_NOWDOC: function () {
    // edge case : empty now doc
    if (this.isDOC_MATCH(this.offset, true)) {
      // @fixme : never reached (may be caused by quotes)
      this.consume(this.heredoc_label.length);
      this.popState();
      return this.tok.T_END_HEREDOC;
    }
    // SCANNING CONTENTS
    let ch = this._input[this.offset - 1];
    while (this.offset < this.size) {
      if (newline.includes(ch)) {
        ch = this.input();
        if (this.isDOC_MATCH(this.offset, true)) {
          this.unput(1).popState();
          this.appendToken(this.tok.T_END_HEREDOC, this.heredoc_label.length);
          return this.tok.T_ENCAPSED_AND_WHITESPACE;
        }
      } else {
        ch = this.input();
      }
    }
    // too bad ! reached end of document (will get a parse error)
    return this.tok.T_ENCAPSED_AND_WHITESPACE;
  },

  matchST_HEREDOC: function () {
    // edge case : empty here doc
    let ch = this.input();
    if (this.isDOC_MATCH(this.offset, true)) {
      this.consume(this.heredoc_label.length - 1);
      this.popState();
      return this.tok.T_END_HEREDOC;
    }
    // SCANNING CONTENTS
    while (this.offset < this.size) {
      if (ch === "\\") {
        ch = this.input(); // ignore next
        if (!newline.includes(ch)) {
          ch = this.input();
        }
      }

      if (newline.includes(ch)) {
        ch = this.input();
        if (this.isDOC_MATCH(this.offset, true)) {
          this.unput(1).popState();
          this.appendToken(this.tok.T_END_HEREDOC, this.heredoc_label.length);
          return this.tok.T_ENCAPSED_AND_WHITESPACE;
        }
      } else if (ch === "$") {
        ch = this.input();
        if (ch === "{") {
          // start of ${
          this.begin("ST_LOOKING_FOR_VARNAME");
          if (this.yytext.length > 2) {
            this.appendToken(this.tok.T_DOLLAR_OPEN_CURLY_BRACES, 2);
            this.unput(2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            return this.tok.T_DOLLAR_OPEN_CURLY_BRACES;
          }
        } else if (this.is_LABEL_START()) {
          // start of $var...
          const yyoffset = this.offset;
          const next = this.consume_VARIABLE();
          if (this.yytext.length > this.offset - yyoffset + 2) {
            this.appendToken(next, this.offset - yyoffset + 2);
            this.unput(this.offset - yyoffset + 2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            return next;
          }
          //console.log(this.yytext);
        }
      } else if (ch === "{") {
        ch = this.input();
        if (ch === "$") {
          // start of {$...
          this.begin("ST_IN_SCRIPTING");
          if (this.yytext.length > 2) {
            this.appendToken(this.tok.T_CURLY_OPEN, 1);
            this.unput(2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            this.unput(1);
            return this.tok.T_CURLY_OPEN;
          }
        }
      } else {
        ch = this.input();
      }
    }

    // too bad ! reached end of document (will get a parse error)
    return this.tok.T_ENCAPSED_AND_WHITESPACE;
  },

  consume_VARIABLE: function () {
    this.consume_LABEL();
    const ch = this.input();
    if (ch == "[") {
      this.unput(1);
      this.begin("ST_VAR_OFFSET");
      return this.tok.T_VARIABLE;
    } else if (ch === "-") {
      if (this.input() === ">") {
        this.input();
        if (this.is_LABEL_START()) {
          this.begin("ST_LOOKING_FOR_PROPERTY");
        }
        this.unput(3);
        return this.tok.T_VARIABLE;
      } else {
        this.unput(2);
      }
    } else {
      if (ch) this.unput(1);
    }
    return this.tok.T_VARIABLE;
  },
  // HANDLES BACKQUOTES
  matchST_BACKQUOTE: function () {
    let ch = this.input();
    if (ch === "$") {
      ch = this.input();
      if (ch === "{") {
        this.begin("ST_LOOKING_FOR_VARNAME");
        return this.tok.T_DOLLAR_OPEN_CURLY_BRACES;
      } else if (this.is_LABEL_START()) {
        const tok = this.consume_VARIABLE();
        return tok;
      }
    } else if (ch === "{") {
      if (this._input[this.offset] === "$") {
        this.begin("ST_IN_SCRIPTING");
        return this.tok.T_CURLY_OPEN;
      }
    } else if (ch === "`") {
      this.popState();
      return "`";
    }

    // any char
    while (this.offset < this.size) {
      if (ch === "\\") {
        this.input();
      } else if (ch === "`") {
        this.unput(1);
        this.popState();
        this.appendToken("`", 1);
        break;
      } else if (ch === "$") {
        ch = this.input();
        if (ch === "{") {
          this.begin("ST_LOOKING_FOR_VARNAME");
          if (this.yytext.length > 2) {
            this.appendToken(this.tok.T_DOLLAR_OPEN_CURLY_BRACES, 2);
            this.unput(2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            return this.tok.T_DOLLAR_OPEN_CURLY_BRACES;
          }
        } else if (this.is_LABEL_START()) {
          // start of $var...
          const yyoffset = this.offset;
          const next = this.consume_VARIABLE();
          if (this.yytext.length > this.offset - yyoffset + 2) {
            this.appendToken(next, this.offset - yyoffset + 2);
            this.unput(this.offset - yyoffset + 2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            return next;
          }
        }
        continue;
      } else if (ch === "{") {
        ch = this.input();
        if (ch === "$") {
          // start of {$...
          this.begin("ST_IN_SCRIPTING");
          if (this.yytext.length > 2) {
            this.appendToken(this.tok.T_CURLY_OPEN, 1);
            this.unput(2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            this.unput(1);
            return this.tok.T_CURLY_OPEN;
          }
        }
        continue;
      }
      ch = this.input();
    }
    return this.tok.T_ENCAPSED_AND_WHITESPACE;
  },

  matchST_DOUBLE_QUOTES: function () {
    let ch = this.input();
    if (ch === "$") {
      ch = this.input();
      if (ch === "{") {
        this.begin("ST_LOOKING_FOR_VARNAME");
        return this.tok.T_DOLLAR_OPEN_CURLY_BRACES;
      } else if (this.is_LABEL_START()) {
        const tok = this.consume_VARIABLE();
        return tok;
      }
    } else if (ch === "{") {
      if (this._input[this.offset] === "$") {
        this.begin("ST_IN_SCRIPTING");
        return this.tok.T_CURLY_OPEN;
      }
    } else if (ch === '"') {
      this.popState();
      return '"';
    }

    // any char
    while (this.offset < this.size) {
      if (ch === "\\") {
        this.input();
      } else if (ch === '"') {
        this.unput(1);
        this.popState();
        this.appendToken('"', 1);
        break;
      } else if (ch === "$") {
        ch = this.input();
        if (ch === "{") {
          this.begin("ST_LOOKING_FOR_VARNAME");
          if (this.yytext.length > 2) {
            this.appendToken(this.tok.T_DOLLAR_OPEN_CURLY_BRACES, 2);
            this.unput(2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            return this.tok.T_DOLLAR_OPEN_CURLY_BRACES;
          }
        } else if (this.is_LABEL_START()) {
          // start of $var...
          const yyoffset = this.offset;
          const next = this.consume_VARIABLE();
          if (this.yytext.length > this.offset - yyoffset + 2) {
            this.appendToken(next, this.offset - yyoffset + 2);
            this.unput(this.offset - yyoffset + 2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            return next;
          }
        }
        if (ch) this.unput(1);
      } else if (ch === "{") {
        ch = this.input();
        if (ch === "$") {
          // start of {$...
          this.begin("ST_IN_SCRIPTING");
          if (this.yytext.length > 2) {
            this.appendToken(this.tok.T_CURLY_OPEN, 1);
            this.unput(2);
            return this.tok.T_ENCAPSED_AND_WHITESPACE;
          } else {
            // @fixme : yytext = '"{$' (this.yytext.length > 3)
            this.unput(1);
            return this.tok.T_CURLY_OPEN;
          }
        }
        if (ch) this.unput(1);
      }
      ch = this.input();
    }
    return this.tok.T_ENCAPSED_AND_WHITESPACE;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var tokens$3 = {
  T_STRING: function () {
    const token = this.yytext.toLowerCase();
    let id = this.keywords[token];
    if (typeof id !== "number") {
      if (token === "yield") {
        if (this.version >= 700 && this.tryMatch(" from")) {
          this.consume(5);
          id = this.tok.T_YIELD_FROM;
        } else {
          id = this.tok.T_YIELD;
        }
      } else {
        id = this.tok.T_STRING;
        if (token === "b" || token === "B") {
          const ch = this.input();
          if (ch === '"') {
            return this.ST_DOUBLE_QUOTES();
          } else if (ch === "'") {
            return this.T_CONSTANT_ENCAPSED_STRING();
          } else if (ch) {
            this.unput(1);
          }
        }
      }
    }

    // https://github.com/php/php-src/blob/master/Zend/zend_language_scanner.l#L1546
    if (id === this.tok.T_ENUM) {
      if (this.version < 801) {
        return this.tok.T_STRING;
      }
      const initial = this.offset;
      let ch = this.input();
      while (ch == " ") {
        ch = this.input();
      }
      let isEnum = false;
      if (this.is_LABEL_START()) {
        while (this.is_LABEL()) {
          ch += this.input();
        }
        const label = ch.slice(0, -1).toLowerCase();
        isEnum = label !== "extends" && label !== "implements";
      }

      this.unput(this.offset - initial);
      return isEnum ? this.tok.T_ENUM : this.tok.T_STRING;
    }

    if (this.offset < this.size && id !== this.tok.T_YIELD_FROM) {
      // If immediately followed by a backslash, this is a T_NAME_RELATIVE or T_NAME_QUALIFIED.
      let ch = this.input();
      if (ch === "\\") {
        id =
          token === "namespace"
            ? this.tok.T_NAME_RELATIVE
            : this.tok.T_NAME_QUALIFIED;
        do {
          if (this._input[this.offset] === "{") {
            // e.g. when using group use statements, the last '\\' is followed by a '{'
            this.input();
            break;
          }

          this.consume_LABEL();
          ch = this.input();
        } while (ch === "\\");
      }

      if (ch) {
        this.unput(1);
      }
    }

    return id;
  },
  // reads a custom token
  consume_TOKEN: function () {
    const ch = this._input[this.offset - 1];
    const fn = this.tokenTerminals[ch];
    if (fn) {
      return fn.apply(this, []);
    } else {
      return this.yytext;
    }
  },
  // list of special char tokens
  tokenTerminals: {
    $: function () {
      this.offset++;
      if (this.is_LABEL_START()) {
        this.offset--;
        this.consume_LABEL();
        return this.tok.T_VARIABLE;
      } else {
        this.offset--;
        return "$";
      }
    },
    "-": function () {
      const nchar = this._input[this.offset];
      if (nchar === ">") {
        this.begin("ST_LOOKING_FOR_PROPERTY").input();
        return this.tok.T_OBJECT_OPERATOR;
      } else if (nchar === "-") {
        this.input();
        return this.tok.T_DEC;
      } else if (nchar === "=") {
        this.input();
        return this.tok.T_MINUS_EQUAL;
      }
      return "-";
    },
    "\\": function () {
      if (this.offset < this.size) {
        this.input();
        if (this.is_LABEL_START()) {
          let ch;
          do {
            if (this._input[this.offset] === "{") {
              // e.g. when using group use statements, the last '\\' is followed by a '{'
              this.input();
              break;
            }

            this.consume_LABEL();
            ch = this.input();
          } while (ch === "\\");

          this.unput(1);

          return this.tok.T_NAME_FULLY_QUALIFIED;
        } else {
          this.unput(1);
        }
      }
      return this.tok.T_NS_SEPARATOR;
    },
    "/": function () {
      if (this._input[this.offset] === "=") {
        this.input();
        return this.tok.T_DIV_EQUAL;
      }
      return "/";
    },
    ":": function () {
      if (this._input[this.offset] === ":") {
        this.input();
        return this.tok.T_DOUBLE_COLON;
      } else {
        return ":";
      }
    },
    "(": function () {
      const initial = this.offset;
      this.input();
      if (this.is_TABSPACE()) {
        this.consume_TABSPACE().input();
      }
      if (this.is_LABEL_START()) {
        const yylen = this.yytext.length;
        this.consume_LABEL();
        const castToken = this.yytext.substring(yylen - 1).toLowerCase();
        const castId = this.castKeywords[castToken];
        if (typeof castId === "number") {
          this.input();
          if (this.is_TABSPACE()) {
            this.consume_TABSPACE().input();
          }
          if (this._input[this.offset - 1] === ")") {
            return castId;
          }
        }
      }
      // revert the check
      this.unput(this.offset - initial);
      return "(";
    },
    "=": function () {
      const nchar = this._input[this.offset];
      if (nchar === ">") {
        this.input();
        return this.tok.T_DOUBLE_ARROW;
      } else if (nchar === "=") {
        if (this._input[this.offset + 1] === "=") {
          this.consume(2);
          return this.tok.T_IS_IDENTICAL;
        } else {
          this.input();
          return this.tok.T_IS_EQUAL;
        }
      }
      return "=";
    },
    "+": function () {
      const nchar = this._input[this.offset];
      if (nchar === "+") {
        this.input();
        return this.tok.T_INC;
      } else if (nchar === "=") {
        this.input();
        return this.tok.T_PLUS_EQUAL;
      }
      return "+";
    },
    "!": function () {
      if (this._input[this.offset] === "=") {
        if (this._input[this.offset + 1] === "=") {
          this.consume(2);
          return this.tok.T_IS_NOT_IDENTICAL;
        } else {
          this.input();
          return this.tok.T_IS_NOT_EQUAL;
        }
      }
      return "!";
    },
    "?": function () {
      if (this.version >= 700 && this._input[this.offset] === "?") {
        if (this.version >= 704 && this._input[this.offset + 1] === "=") {
          this.consume(2);
          return this.tok.T_COALESCE_EQUAL;
        } else {
          this.input();
          return this.tok.T_COALESCE;
        }
      }
      if (
        this.version >= 800 &&
        this._input[this.offset] === "-" &&
        this._input[this.offset + 1] === ">"
      ) {
        this.consume(2);
        return this.tok.T_NULLSAFE_OBJECT_OPERATOR;
      }
      return "?";
    },
    "<": function () {
      let nchar = this._input[this.offset];
      if (nchar === "<") {
        nchar = this._input[this.offset + 1];
        if (nchar === "=") {
          this.consume(2);
          return this.tok.T_SL_EQUAL;
        } else if (nchar === "<") {
          if (this.is_HEREDOC()) {
            return this.tok.T_START_HEREDOC;
          }
        }
        this.input();
        return this.tok.T_SL;
      } else if (nchar === "=") {
        this.input();
        if (this.version >= 700 && this._input[this.offset] === ">") {
          this.input();
          return this.tok.T_SPACESHIP;
        } else {
          return this.tok.T_IS_SMALLER_OR_EQUAL;
        }
      } else if (nchar === ">") {
        this.input();
        return this.tok.T_IS_NOT_EQUAL;
      }
      return "<";
    },
    ">": function () {
      let nchar = this._input[this.offset];
      if (nchar === "=") {
        this.input();
        return this.tok.T_IS_GREATER_OR_EQUAL;
      } else if (nchar === ">") {
        nchar = this._input[this.offset + 1];
        if (nchar === "=") {
          this.consume(2);
          return this.tok.T_SR_EQUAL;
        } else {
          this.input();
          return this.tok.T_SR;
        }
      }
      return ">";
    },
    "*": function () {
      const nchar = this._input[this.offset];
      if (nchar === "=") {
        this.input();
        return this.tok.T_MUL_EQUAL;
      } else if (nchar === "*") {
        this.input();
        if (this._input[this.offset] === "=") {
          this.input();
          return this.tok.T_POW_EQUAL;
        } else {
          return this.tok.T_POW;
        }
      }
      return "*";
    },
    ".": function () {
      const nchar = this._input[this.offset];
      if (nchar === "=") {
        this.input();
        return this.tok.T_CONCAT_EQUAL;
      } else if (nchar === "." && this._input[this.offset + 1] === ".") {
        this.consume(2);
        return this.tok.T_ELLIPSIS;
      }
      return ".";
    },
    "%": function () {
      if (this._input[this.offset] === "=") {
        this.input();
        return this.tok.T_MOD_EQUAL;
      }
      return "%";
    },
    "&": function () {
      const nchar = this._input[this.offset];
      if (nchar === "=") {
        this.input();
        return this.tok.T_AND_EQUAL;
      } else if (nchar === "&") {
        this.input();
        return this.tok.T_BOOLEAN_AND;
      }
      return "&";
    },
    "|": function () {
      const nchar = this._input[this.offset];
      if (nchar === "=") {
        this.input();
        return this.tok.T_OR_EQUAL;
      } else if (nchar === "|") {
        this.input();
        return this.tok.T_BOOLEAN_OR;
      }
      return "|";
    },
    "^": function () {
      if (this._input[this.offset] === "=") {
        this.input();
        return this.tok.T_XOR_EQUAL;
      }
      return "^";
    },
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const tokens$2 = ";:,.\\[]()|^&+-/*=%!~$<>?@";

var utils$1 = {
  // check if the char can be a numeric
  is_NUM: function () {
    const ch = this._input.charCodeAt(this.offset - 1);
    return (ch > 47 && ch < 58) || ch === 95;
  },

  // check if the char can be a numeric
  is_NUM_START: function () {
    const ch = this._input.charCodeAt(this.offset - 1);
    return ch > 47 && ch < 58;
  },

  // check if current char can be a label
  is_LABEL: function () {
    const ch = this._input.charCodeAt(this.offset - 1);
    return (
      (ch > 96 && ch < 123) ||
      (ch > 64 && ch < 91) ||
      ch === 95 ||
      (ch > 47 && ch < 58) ||
      ch > 126
    );
  },

  // check if current char can be a label
  is_LABEL_START: function () {
    const ch = this._input.charCodeAt(this.offset - 1);
    // A - Z
    if (ch > 64 && ch < 91) return true;
    // a - z
    if (ch > 96 && ch < 123) return true;
    // _ (95)
    if (ch === 95) return true;
    // utf8 / extended
    if (ch > 126) return true;
    // else
    return false;
  },

  // reads each char of the label
  consume_LABEL: function () {
    while (this.offset < this.size) {
      const ch = this.input();
      if (!this.is_LABEL()) {
        if (ch) this.unput(1);
        break;
      }
    }
    return this;
  },

  // check if current char is a token char
  is_TOKEN: function () {
    const ch = this._input[this.offset - 1];
    return tokens$2.indexOf(ch) !== -1;
  },
  // check if current char is a whitespace
  is_WHITESPACE: function () {
    const ch = this._input[this.offset - 1];
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  },
  // check if current char is a whitespace (without newlines)
  is_TABSPACE: function () {
    const ch = this._input[this.offset - 1];
    return ch === " " || ch === "\t";
  },
  // consume all whitespaces (excluding newlines)
  consume_TABSPACE: function () {
    while (this.offset < this.size) {
      const ch = this.input();
      if (!this.is_TABSPACE()) {
        if (ch) this.unput(1);
        break;
      }
    }
    return this;
  },
  // check if current char can be a hexadecimal number
  is_HEX: function () {
    const ch = this._input.charCodeAt(this.offset - 1);
    // 0 - 9
    if (ch > 47 && ch < 58) return true;
    // A - F
    if (ch > 64 && ch < 71) return true;
    // a - f
    if (ch > 96 && ch < 103) return true;
    // _ (code 95)
    if (ch === 95) return true;
    // else
    return false;
  },
  // check if current char can be an octal number
  is_OCTAL: function () {
    const ch = this._input.charCodeAt(this.offset - 1);
    // 0 - 7
    if (ch > 47 && ch < 56) return true;
    // _ (code 95)
    if (ch === 95) return true;
    // else
    return false;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

/**
 * This is the php lexer. It will tokenize the string for helping the
 * parser to build the AST from its grammar.
 *
 * @constructor Lexer
 * @memberOf module:php-parser
 * @property {number} EOF
 * @property {boolean} all_tokens defines if all tokens must be retrieved (used by token_get_all only)
 * @property {boolean} comment_tokens extracts comments tokens
 * @property {boolean} mode_eval enables the evald mode (ignore opening tags)
 * @property {boolean} asp_tags disables by default asp tags mode
 * @property {boolean} short_tags enables by default short tags mode
 * @property {object} keywords List of php keyword
 * @property {object} castKeywords List of php keywords for type casting
 */
const Lexer = function (engine) {
  this.engine = engine;
  this.tok = this.engine.tokens.names;
  this.EOF = 1;
  this.debug = false;
  this.all_tokens = true;
  this.comment_tokens = false;
  this.mode_eval = false;
  this.asp_tags = false;
  this.short_tags = false;
  this.version = 801;
  this.yyprevcol = 0;
  this.keywords = {
    __class__: this.tok.T_CLASS_C,
    __trait__: this.tok.T_TRAIT_C,
    __function__: this.tok.T_FUNC_C,
    __method__: this.tok.T_METHOD_C,
    __line__: this.tok.T_LINE,
    __file__: this.tok.T_FILE,
    __dir__: this.tok.T_DIR,
    __namespace__: this.tok.T_NS_C,
    exit: this.tok.T_EXIT,
    die: this.tok.T_EXIT,
    function: this.tok.T_FUNCTION,
    const: this.tok.T_CONST,
    return: this.tok.T_RETURN,
    try: this.tok.T_TRY,
    catch: this.tok.T_CATCH,
    finally: this.tok.T_FINALLY,
    throw: this.tok.T_THROW,
    if: this.tok.T_IF,
    elseif: this.tok.T_ELSEIF,
    endif: this.tok.T_ENDIF,
    else: this.tok.T_ELSE,
    while: this.tok.T_WHILE,
    endwhile: this.tok.T_ENDWHILE,
    do: this.tok.T_DO,
    for: this.tok.T_FOR,
    endfor: this.tok.T_ENDFOR,
    foreach: this.tok.T_FOREACH,
    endforeach: this.tok.T_ENDFOREACH,
    declare: this.tok.T_DECLARE,
    enddeclare: this.tok.T_ENDDECLARE,
    instanceof: this.tok.T_INSTANCEOF,
    as: this.tok.T_AS,
    switch: this.tok.T_SWITCH,
    endswitch: this.tok.T_ENDSWITCH,
    case: this.tok.T_CASE,
    default: this.tok.T_DEFAULT,
    break: this.tok.T_BREAK,
    continue: this.tok.T_CONTINUE,
    goto: this.tok.T_GOTO,
    echo: this.tok.T_ECHO,
    print: this.tok.T_PRINT,
    class: this.tok.T_CLASS,
    interface: this.tok.T_INTERFACE,
    trait: this.tok.T_TRAIT,
    enum: this.tok.T_ENUM,
    extends: this.tok.T_EXTENDS,
    implements: this.tok.T_IMPLEMENTS,
    new: this.tok.T_NEW,
    clone: this.tok.T_CLONE,
    var: this.tok.T_VAR,
    eval: this.tok.T_EVAL,
    include: this.tok.T_INCLUDE,
    include_once: this.tok.T_INCLUDE_ONCE,
    require: this.tok.T_REQUIRE,
    require_once: this.tok.T_REQUIRE_ONCE,
    namespace: this.tok.T_NAMESPACE,
    use: this.tok.T_USE,
    insteadof: this.tok.T_INSTEADOF,
    global: this.tok.T_GLOBAL,
    isset: this.tok.T_ISSET,
    empty: this.tok.T_EMPTY,
    __halt_compiler: this.tok.T_HALT_COMPILER,
    static: this.tok.T_STATIC,
    abstract: this.tok.T_ABSTRACT,
    final: this.tok.T_FINAL,
    private: this.tok.T_PRIVATE,
    protected: this.tok.T_PROTECTED,
    public: this.tok.T_PUBLIC,
    unset: this.tok.T_UNSET,
    list: this.tok.T_LIST,
    array: this.tok.T_ARRAY,
    callable: this.tok.T_CALLABLE,
    or: this.tok.T_LOGICAL_OR,
    and: this.tok.T_LOGICAL_AND,
    xor: this.tok.T_LOGICAL_XOR,
    match: this.tok.T_MATCH,
    readonly: this.tok.T_READ_ONLY,
  };
  this.castKeywords = {
    int: this.tok.T_INT_CAST,
    integer: this.tok.T_INT_CAST,
    real: this.tok.T_DOUBLE_CAST,
    double: this.tok.T_DOUBLE_CAST,
    float: this.tok.T_DOUBLE_CAST,
    string: this.tok.T_STRING_CAST,
    binary: this.tok.T_STRING_CAST,
    array: this.tok.T_ARRAY_CAST,
    object: this.tok.T_OBJECT_CAST,
    bool: this.tok.T_BOOL_CAST,
    boolean: this.tok.T_BOOL_CAST,
    unset: this.tok.T_UNSET_CAST,
  };
};

/**
 * Initialize the lexer with the specified input
 * @function Lexer#setInput
 * @memberOf module:php-parser
 */
Lexer.prototype.setInput = function (input) {
  this._input = input;
  this.size = input.length;
  this.yylineno = 1;
  this.offset = 0;
  this.yyprevcol = 0;
  this.yytext = "";
  this.yylloc = {
    first_offset: 0,
    first_line: 1,
    first_column: 0,
    prev_offset: 0,
    prev_line: 1,
    prev_column: 0,
    last_line: 1,
    last_column: 0,
  };
  this.tokens = [];
  if (this.version > 703) {
    this.keywords.fn = this.tok.T_FN;
  } else {
    delete this.keywords.fn;
  }
  this.done = this.offset >= this.size;
  if (!this.all_tokens && this.mode_eval) {
    this.conditionStack = ["INITIAL"];
    this.begin("ST_IN_SCRIPTING");
  } else {
    this.conditionStack = [];
    this.begin("INITIAL");
  }
  // https://github.com/php/php-src/blob/999e32b65a8a4bb59e27e538fa68ffae4b99d863/Zend/zend_language_scanner.h#L59
  // Used for heredoc and nowdoc
  this.heredoc_label = {
    label: "",
    length: 0,
    indentation: 0,
    indentation_uses_spaces: false,
    finished: false,
    /*
     * this used for parser to detemine the if current node segment is first encaps node.
     * if ture, the indentation will remove from the begining. and if false, the prev node
     * might be a variable '}' ,and the leading spaces should not be removed util meet the
     * first \n
     */
    first_encaps_node: false,
    // for backward compatible
    /* istanbul ignore next */
    toString: function () {
      this.label;
    },
  };
  return this;
};

/**
 * consumes and returns one char from the input
 * @function Lexer#input
 * @memberOf module:php-parser
 */
Lexer.prototype.input = function () {
  const ch = this._input[this.offset];
  if (!ch) return "";
  this.yytext += ch;
  this.offset++;
  if (ch === "\r" && this._input[this.offset] === "\n") {
    this.yytext += "\n";
    this.offset++;
  }
  if (ch === "\n" || ch === "\r") {
    this.yylloc.last_line = ++this.yylineno;
    this.yyprevcol = this.yylloc.last_column;
    this.yylloc.last_column = 0;
  } else {
    this.yylloc.last_column++;
  }
  return ch;
};

/**
 * revert eating specified size
 * @function Lexer#unput
 * @memberOf module:php-parser
 */
Lexer.prototype.unput = function (size) {
  if (size === 1) {
    // 1 char unput (most cases)
    this.offset--;
    if (
      this._input[this.offset] === "\n" &&
      this._input[this.offset - 1] === "\r"
    ) {
      this.offset--;
      size++;
    }
    if (
      this._input[this.offset] === "\r" ||
      this._input[this.offset] === "\n"
    ) {
      this.yylloc.last_line--;
      this.yylineno--;
      this.yylloc.last_column = this.yyprevcol;
    } else {
      this.yylloc.last_column--;
    }
    this.yytext = this.yytext.substring(0, this.yytext.length - size);
  } else if (size > 0) {
    this.offset -= size;
    if (size < this.yytext.length) {
      this.yytext = this.yytext.substring(0, this.yytext.length - size);
      // re-calculate position
      this.yylloc.last_line = this.yylloc.first_line;
      this.yylloc.last_column = this.yyprevcol = this.yylloc.first_column;
      for (let i = 0; i < this.yytext.length; i++) {
        let c = this.yytext[i];
        if (c === "\r") {
          c = this.yytext[++i];
          this.yyprevcol = this.yylloc.last_column;
          this.yylloc.last_line++;
          this.yylloc.last_column = 0;
          if (c !== "\n") {
            if (c === "\r") {
              this.yylloc.last_line++;
            } else {
              this.yylloc.last_column++;
            }
          }
        } else if (c === "\n") {
          this.yyprevcol = this.yylloc.last_column;
          this.yylloc.last_line++;
          this.yylloc.last_column = 0;
        } else {
          this.yylloc.last_column++;
        }
      }
      this.yylineno = this.yylloc.last_line;
    } else {
      // reset full text
      this.yytext = "";
      this.yylloc.last_line = this.yylineno = this.yylloc.first_line;
      this.yylloc.last_column = this.yylloc.first_column;
    }
  }

  return this;
};

/**
 * check if the text matches
 * @function Lexer#tryMatch
 * @memberOf module:php-parser
 * @param {string} text
 * @returns {boolean}
 */
Lexer.prototype.tryMatch = function (text) {
  return text === this.ahead(text.length);
};

/**
 * check if the text matches
 * @function Lexer#tryMatchCaseless
 * @memberOf module:php-parser
 * @param {string} text
 * @returns {boolean}
 */
Lexer.prototype.tryMatchCaseless = function (text) {
  return text === this.ahead(text.length).toLowerCase();
};

/**
 * look ahead
 * @function Lexer#ahead
 * @memberOf module:php-parser
 * @param {number} size
 * @returns {string}
 */
Lexer.prototype.ahead = function (size) {
  let text = this._input.substring(this.offset, this.offset + size);
  if (
    text[text.length - 1] === "\r" &&
    this._input[this.offset + size + 1] === "\n"
  ) {
    text += "\n";
  }
  return text;
};

/**
 * consume the specified size
 * @function Lexer#consume
 * @memberOf module:php-parser
 * @param {number} size
 * @returns {Lexer}
 */
Lexer.prototype.consume = function (size) {
  for (let i = 0; i < size; i++) {
    const ch = this._input[this.offset];
    if (!ch) break;
    this.yytext += ch;
    this.offset++;
    if (ch === "\r" && this._input[this.offset] === "\n") {
      this.yytext += "\n";
      this.offset++;
      i++;
    }
    if (ch === "\n" || ch === "\r") {
      this.yylloc.last_line = ++this.yylineno;
      this.yyprevcol = this.yylloc.last_column;
      this.yylloc.last_column = 0;
    } else {
      this.yylloc.last_column++;
    }
  }
  return this;
};

/**
 * Gets the current state
 * @function Lexer#getState
 * @memberOf module:php-parser
 */
Lexer.prototype.getState = function () {
  return {
    yytext: this.yytext,
    offset: this.offset,
    yylineno: this.yylineno,
    yyprevcol: this.yyprevcol,
    yylloc: {
      first_offset: this.yylloc.first_offset,
      first_line: this.yylloc.first_line,
      first_column: this.yylloc.first_column,
      last_line: this.yylloc.last_line,
      last_column: this.yylloc.last_column,
    },
    heredoc_label: this.heredoc_label,
  };
};

/**
 * Sets the current lexer state
 * @function Lexer#setState
 * @memberOf module:php-parser
 */
Lexer.prototype.setState = function (state) {
  this.yytext = state.yytext;
  this.offset = state.offset;
  this.yylineno = state.yylineno;
  this.yyprevcol = state.yyprevcol;
  this.yylloc = state.yylloc;
  if (state.heredoc_label) {
    this.heredoc_label = state.heredoc_label;
  }
  return this;
};

/**
 * prepend next token
 * @function Lexer#appendToken
 * @memberOf module:php-parser
 * @param {*} value
 * @param {*} ahead
 * @returns {Lexer}
 */
Lexer.prototype.appendToken = function (value, ahead) {
  this.tokens.push([value, ahead]);
  return this;
};

/**
 * return next match that has a token
 * @function Lexer#lex
 * @memberOf module:php-parser
 * @returns {number|string}
 */
Lexer.prototype.lex = function () {
  this.yylloc.prev_offset = this.offset;
  this.yylloc.prev_line = this.yylloc.last_line;
  this.yylloc.prev_column = this.yylloc.last_column;
  let token = this.next() || this.lex();
  if (!this.all_tokens) {
    while (
      token === this.tok.T_WHITESPACE || // ignore white space
      (!this.comment_tokens &&
        (token === this.tok.T_COMMENT || // ignore single lines comments
          token === this.tok.T_DOC_COMMENT)) || // ignore doc comments
      // ignore open tags
      token === this.tok.T_OPEN_TAG
    ) {
      token = this.next() || this.lex();
    }
    if (token == this.tok.T_OPEN_TAG_WITH_ECHO) {
      // https://github.com/php/php-src/blob/7ff186434e82ee7be7c59d0db9a976641cf7b09c/Zend/zend_compile.c#L1683
      // open tag with echo statement
      return this.tok.T_ECHO;
    } else if (token === this.tok.T_CLOSE_TAG) {
      // https://github.com/php/php-src/blob/7ff186434e82ee7be7c59d0db9a976641cf7b09c/Zend/zend_compile.c#L1680
      return ";"; /* implicit ; */
    }
  }
  if (!this.yylloc.prev_offset) {
    this.yylloc.prev_offset = this.yylloc.first_offset;
    this.yylloc.prev_line = this.yylloc.first_line;
    this.yylloc.prev_column = this.yylloc.first_column;
  }
  /*else if (this.yylloc.prev_offset === this.offset && this.offset !== this.size) {
    throw new Error('Infinite loop @ ' + this.offset + ' / ' + this.size);
  }*/
  return token;
};

/**
 * activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
 * @function Lexer#begin
 * @memberOf module:php-parser
 * @param {*} condition
 * @returns {Lexer}
 */
Lexer.prototype.begin = function (condition) {
  this.conditionStack.push(condition);
  this.curCondition = condition;
  this.stateCb = this["match" + condition];
  /* istanbul ignore next */
  if (typeof this.stateCb !== "function") {
    throw new Error('Undefined condition state "' + condition + '"');
  }
  return this;
};

/**
 * pop the previously active lexer condition state off the condition stack
 * @function Lexer#popState
 * @memberOf module:php-parser
 * @returns {string|*}
 */
Lexer.prototype.popState = function () {
  const n = this.conditionStack.length - 1;
  const condition = n > 0 ? this.conditionStack.pop() : this.conditionStack[0];
  this.curCondition = this.conditionStack[this.conditionStack.length - 1];
  this.stateCb = this["match" + this.curCondition];
  /* istanbul ignore next */
  if (typeof this.stateCb !== "function") {
    throw new Error('Undefined condition state "' + this.curCondition + '"');
  }
  return condition;
};

/**
 * return next match in input
 * @function Lexer#next
 * @memberOf module:php-parser
 * @returns {number|*}
 */
Lexer.prototype.next = function () {
  let token;
  if (!this._input) {
    this.done = true;
  }
  this.yylloc.first_offset = this.offset;
  this.yylloc.first_line = this.yylloc.last_line;
  this.yylloc.first_column = this.yylloc.last_column;
  this.yytext = "";
  if (this.done) {
    this.yylloc.prev_offset = this.yylloc.first_offset;
    this.yylloc.prev_line = this.yylloc.first_line;
    this.yylloc.prev_column = this.yylloc.first_column;
    return this.EOF;
  }
  if (this.tokens.length > 0) {
    token = this.tokens.shift();
    if (typeof token[1] === "object") {
      this.setState(token[1]);
    } else {
      this.consume(token[1]);
    }
    token = token[0];
  } else {
    token = this.stateCb.apply(this, []);
  }
  if (this.offset >= this.size && this.tokens.length === 0) {
    this.done = true;
  }
  /* istanbul ignore next */
  if (this.debug) {
    let tName = token;
    if (typeof tName === "number") {
      tName = this.engine.tokens.values[tName];
    } else {
      tName = '"' + tName + '"';
    }
    const e = new Error(
      tName +
        "\tfrom " +
        this.yylloc.first_line +
        "," +
        this.yylloc.first_column +
        "\t - to " +
        this.yylloc.last_line +
        "," +
        this.yylloc.last_column +
        '\t"' +
        this.yytext +
        '"'
    );
    // eslint-disable-next-line no-console
    console.error(e.stack);
  }
  return token;
};

// extends the lexer with states
[
  attribute$1,
  comments,
  initial,
  numbers,
  property$1,
  scripting,
  strings,
  tokens$3,
  utils$1,
].forEach(function (ext) {
  for (const k in ext) {
    Lexer.prototype[k] = ext[k];
  }
});

var lexer$1 = Lexer;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

/**
 * Each Position object consists of a line number (1-indexed) and a column number (0-indexed):
 * @constructor Position
 * @memberOf module:php-parser
 * @property {number} line
 * @property {number} column
 * @property {number} offset
 */
const Position$2 = function (line, column, offset) {
  this.line = line;
  this.column = column;
  this.offset = offset;
};

var position = Position$2;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var array$1 = {
  /*
   * Parse an array
   * ```ebnf
   * array ::= T_ARRAY '(' array_pair_list ')' |
   *   '[' array_pair_list ']'
   * ```
   */
  read_array: function () {
    let expect = null;
    let shortForm = false;
    const result = this.node("array");

    if (this.token === this.tok.T_ARRAY) {
      this.next().expect("(");
      expect = ")";
    } else {
      shortForm = true;
      expect = "]";
    }
    let items = [];
    if (this.next().token !== expect) {
      items = this.read_array_pair_list(shortForm);
    }
    this.expect(expect);
    this.next();
    return result(shortForm, items);
  },
  /*
   * Reads an array of items
   * ```ebnf
   * array_pair_list ::= array_pair (',' array_pair?)*
   * ```
   */
  read_array_pair_list: function (shortForm) {
    const self = this;
    return this.read_list(
      function () {
        return self.read_array_pair(shortForm);
      },
      ",",
      true
    );
  },
  /*
   * Reads an entry
   * array_pair:
   *  expr T_DOUBLE_ARROW expr
   *  | expr
   *  | expr T_DOUBLE_ARROW '&' variable
   *  | '&' variable
   *  | expr T_DOUBLE_ARROW T_LIST '(' array_pair_list ')'
   *  | T_LIST '(' array_pair_list ')'
   */
  read_array_pair: function (shortForm) {
    if (
      (!shortForm && this.token === ")") ||
      (shortForm && this.token === "]")
    ) {
      return;
    }

    if (this.token === ",") {
      return this.node("noop")();
    }

    const entry = this.node("entry");

    let key = null;
    let value = null;
    let byRef = false;
    let unpack = false;

    if (this.token === "&") {
      this.next();
      byRef = true;
      value = this.read_variable(true, false);
    } else if (this.token === this.tok.T_ELLIPSIS && this.version >= 704) {
      this.next();
      if (this.token === "&") {
        this.error();
      }
      unpack = true;
      value = this.read_expr();
    } else {
      const expr = this.read_expr();

      if (this.token === this.tok.T_DOUBLE_ARROW) {
        this.next();
        key = expr;

        if (this.token === "&") {
          this.next();
          byRef = true;
          value = this.read_variable(true, false);
        } else {
          value = this.read_expr();
        }
      } else {
        value = expr;
      }
    }

    return entry(key, value, byRef, unpack);
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var _class$1 = {
  /*
   * reading a class
   * ```ebnf
   * class ::= class_scope? T_CLASS T_STRING (T_EXTENDS NAMESPACE_NAME)? (T_IMPLEMENTS (NAMESPACE_NAME ',')* NAMESPACE_NAME)? '{' CLASS_BODY '}'
   * ```
   */
  read_class_declaration_statement: function (attrs) {
    const result = this.node("class");
    const flag = this.read_class_modifiers();
    // graceful mode : ignore token & go next
    if (this.token !== this.tok.T_CLASS) {
      this.error(this.tok.T_CLASS);
      this.next();
      return null;
    }
    this.next().expect(this.tok.T_STRING);
    let propName = this.node("identifier");
    const name = this.text();
    this.next();
    propName = propName(name);
    const propExtends = this.read_extends_from();
    const propImplements = this.read_implements_list();
    this.expect("{");
    const body = this.next().read_class_body(true, false);
    const node = result(propName, propExtends, propImplements, body, flag);
    if (attrs) node.attrGroups = attrs;
    return node;
  },

  read_class_modifiers: function () {
    const modifier = this.read_class_modifier({
      readonly: 0,
      final_or_abstract: 0,
    });
    return [0, 0, modifier.final_or_abstract, modifier.readonly];
  },

  read_class_modifier: function (memo) {
    if (this.token === this.tok.T_READ_ONLY) {
      this.next();
      memo.readonly = 1;
      memo = this.read_class_modifier(memo);
    } else if (
      memo.final_or_abstract === 0 &&
      this.token === this.tok.T_ABSTRACT
    ) {
      this.next();
      memo.final_or_abstract = 1;
      memo = this.read_class_modifier(memo);
    } else if (
      memo.final_or_abstract === 0 &&
      this.token === this.tok.T_FINAL
    ) {
      this.next();
      memo.final_or_abstract = 2;
      memo = this.read_class_modifier(memo);
    }

    return memo;
  },

  /*
   * Reads a class body
   * ```ebnf
   *   class_body ::= (member_flags? (T_VAR | T_STRING | T_FUNCTION))*
   * ```
   */
  read_class_body: function (allow_variables, allow_enum_cases) {
    let result = [];
    let attrs = [];
    while (this.token !== this.EOF && this.token !== "}") {
      if (this.token === this.tok.T_COMMENT) {
        result.push(this.read_comment());
        continue;
      }

      if (this.token === this.tok.T_DOC_COMMENT) {
        result.push(this.read_doc_comment());
        continue;
      }

      // check T_USE trait
      if (this.token === this.tok.T_USE) {
        result = result.concat(this.read_trait_use_statement());
        continue;
      }

      // check enum cases
      if (allow_enum_cases && this.token === this.tok.T_CASE) {
        const enumcase = this.read_enum_case();
        if (this.expect(";")) {
          this.next();
        }
        result = result.concat(enumcase);
        continue;
      }

      if (this.token === this.tok.T_ATTRIBUTE) {
        attrs = this.read_attr_list();
      }

      const locStart = this.position();

      // read member flags
      const flags = this.read_member_flags(false);

      // check constant
      if (this.token === this.tok.T_CONST) {
        const constants = this.read_constant_list(flags, attrs);
        if (this.expect(";")) {
          this.next();
        }
        result = result.concat(constants);
        continue;
      }

      // jump over T_VAR then land on T_VARIABLE
      if (allow_variables && this.token === this.tok.T_VAR) {
        this.next().expect(this.tok.T_VARIABLE);
        flags[0] = null; // public (as null)
        flags[1] = 0; // non static var
      }

      if (this.token === this.tok.T_FUNCTION) {
        // reads a function
        result.push(this.read_function(false, flags, attrs, locStart));
        attrs = [];
      } else if (
        allow_variables &&
        (this.token === this.tok.T_VARIABLE ||
          (this.version >= 801 && this.token === this.tok.T_READ_ONLY) ||
          // support https://wiki.php.net/rfc/typed_properties_v2
          (this.version >= 704 &&
            (this.token === "?" ||
              this.token === this.tok.T_ARRAY ||
              this.token === this.tok.T_CALLABLE ||
              this.token === this.tok.T_NAMESPACE ||
              this.token === this.tok.T_NAME_FULLY_QUALIFIED ||
              this.token === this.tok.T_NAME_QUALIFIED ||
              this.token === this.tok.T_NAME_RELATIVE ||
              this.token === this.tok.T_NS_SEPARATOR ||
              this.token === this.tok.T_STRING)))
      ) {
        // reads a variable
        const variables = this.read_variable_list(flags, attrs);
        attrs = [];
        this.expect(";");
        this.next();
        result = result.concat(variables);
      } else {
        // raise an error
        this.error([
          this.tok.T_CONST,
          ...(allow_variables ? [this.tok.T_VARIABLE] : []),
          ...(allow_enum_cases ? [this.tok.T_CASE] : []),
          this.tok.T_FUNCTION,
        ]);
        // ignore token
        this.next();
      }
    }
    this.expect("}");
    this.next();
    return result;
  },
  /*
   * Reads variable list
   * ```ebnf
   *  variable_list ::= (variable_declaration ',')* variable_declaration
   * ```
   */
  read_variable_list: function (flags, attrs) {
    const result = this.node("propertystatement");

    const properties = this.read_list(
      /*
       * Reads a variable declaration
       *
       * ```ebnf
       *  variable_declaration ::= T_VARIABLE '=' scalar
       * ```
       */
      function read_variable_declaration() {
        const result = this.node("property");
        let readonly = false;
        if (this.token === this.tok.T_READ_ONLY) {
          readonly = true;
          this.next();
        }
        const [nullable, type] = this.read_optional_type();
        this.expect(this.tok.T_VARIABLE);
        let propName = this.node("identifier");
        const name = this.text().substring(1); // ignore $
        this.next();
        propName = propName(name);
        if (this.token === ";" || this.token === ",") {
          return result(propName, null, readonly, nullable, type, attrs || []);
        } else if (this.token === "=") {
          // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L815
          return result(
            propName,
            this.next().read_expr(),
            readonly,
            nullable,
            type,
            attrs || []
          );
        } else {
          this.expect([",", ";", "="]);
          return result(propName, null, nullable, type, attrs || []);
        }
      },
      ","
    );

    return result(null, properties, flags);
  },
  /*
   * Reads constant list
   * ```ebnf
   *  constant_list ::= T_CONST (constant_declaration ',')* constant_declaration
   * ```
   */
  read_constant_list: function (flags, attrs) {
    if (this.expect(this.tok.T_CONST)) {
      this.next();
    }
    const result = this.node("classconstant");
    const items = this.read_list(
      /*
       * Reads a constant declaration
       *
       * ```ebnf
       *  constant_declaration ::= (T_STRING | IDENTIFIER) '=' expr
       * ```
       * @return {Constant} [:link:](AST.md#constant)
       */
      function read_constant_declaration() {
        const result = this.node("constant");
        let constName = null;
        let value = null;
        if (
          this.token === this.tok.T_STRING ||
          (this.version >= 700 && this.is("IDENTIFIER"))
        ) {
          constName = this.node("identifier");
          const name = this.text();
          this.next();
          constName = constName(name);
        } else {
          this.expect("IDENTIFIER");
        }
        if (this.expect("=")) {
          value = this.next().read_expr();
        }
        return result(constName, value);
      },
      ","
    );

    return result(null, items, flags, attrs || []);
  },
  /*
   * Read member flags
   * @return array
   *  1st index : 0 => public, 1 => protected, 2 => private
   *  2nd index : 0 => instance member, 1 => static member
   *  3rd index : 0 => normal, 1 => abstract member, 2 => final member
   */
  read_member_flags: function (asInterface) {
    const result = [-1, -1, -1];
    if (this.is("T_MEMBER_FLAGS")) {
      let idx = 0,
        val = 0;
      do {
        switch (this.token) {
          case this.tok.T_PUBLIC:
            idx = 0;
            val = 0;
            break;
          case this.tok.T_PROTECTED:
            idx = 0;
            val = 1;
            break;
          case this.tok.T_PRIVATE:
            idx = 0;
            val = 2;
            break;
          case this.tok.T_STATIC:
            idx = 1;
            val = 1;
            break;
          case this.tok.T_ABSTRACT:
            idx = 2;
            val = 1;
            break;
          case this.tok.T_FINAL:
            idx = 2;
            val = 2;
            break;
        }
        if (asInterface) {
          if (idx == 0 && val == 2) {
            // an interface can't be private
            this.expect([this.tok.T_PUBLIC, this.tok.T_PROTECTED]);
            val = -1;
          } else if (idx == 2 && val == 1) {
            // an interface cant be abstract
            this.error();
            val = -1;
          }
        }
        if (result[idx] !== -1) {
          // already defined flag
          this.error();
        } else if (val !== -1) {
          result[idx] = val;
        }
      } while (this.next().is("T_MEMBER_FLAGS"));
    }

    if (result[1] == -1) result[1] = 0;
    if (result[2] == -1) result[2] = 0;
    return result;
  },

  /*
   * optional_type:
   *	  /- empty -/	{ $$ = NULL; }
   *   |	type_expr	{ $$ = $1; }
   * ;
   *
   * type_expr:
   *		type		{ $$ = $1; }
   *	|	'?' type	{ $$ = $2; $$->attr |= ZEND_TYPE_NULLABLE; }
   *	|	union_type	{ $$ = $1; }
   * ;
   *
   * type:
   * 		T_ARRAY		{ $$ = zend_ast_create_ex(ZEND_AST_TYPE, IS_ARRAY); }
   * 	|	T_CALLABLE	{ $$ = zend_ast_create_ex(ZEND_AST_TYPE, IS_CALLABLE); }
   * 	|	name		{ $$ = $1; }
   * ;
   *
   * union_type:
   * 		type '|' type       { $$ = zend_ast_create_list(2, ZEND_AST_TYPE_UNION, $1, $3); }
   * 	|	union_type '|' type { $$ = zend_ast_list_add($1, $3); }
   * ;
   */
  read_optional_type: function () {
    let nullable = false;
    if (this.token === "?") {
      nullable = true;
      this.next();
    }
    let type = this.read_types();
    if (nullable && !type) {
      this.raiseError(
        "Expecting a type definition combined with nullable operator"
      );
    }
    if (!nullable && !type) {
      return [false, null];
    }
    if (this.token === "|") {
      type = [type];
      do {
        this.next();
        const variant = this.read_type();
        if (!variant) {
          this.raiseError("Expecting a type definition");
          break;
        }
        type.push(variant);
      } while (this.token === "|");
    }
    return [nullable, type];
  },

  /*
   * reading an interface
   * ```ebnf
   * interface ::= T_INTERFACE T_STRING (T_EXTENDS (NAMESPACE_NAME ',')* NAMESPACE_NAME)? '{' INTERFACE_BODY '}'
   * ```
   */
  read_interface_declaration_statement: function (attrs) {
    const result = this.node("interface");
    if (this.token !== this.tok.T_INTERFACE) {
      this.error(this.tok.T_INTERFACE);
      this.next();
      return null;
    }
    this.next().expect(this.tok.T_STRING);
    let propName = this.node("identifier");
    const name = this.text();
    this.next();
    propName = propName(name);
    const propExtends = this.read_interface_extends_list();
    this.expect("{");
    const body = this.next().read_interface_body();
    return result(propName, propExtends, body, attrs || []);
  },
  /*
   * Reads an interface body
   * ```ebnf
   *   interface_body ::= (member_flags? (T_CONST | T_FUNCTION))*
   * ```
   */
  read_interface_body: function () {
    let result = [],
      attrs = [];

    while (this.token !== this.EOF && this.token !== "}") {
      if (this.token === this.tok.T_COMMENT) {
        result.push(this.read_comment());
        continue;
      }

      if (this.token === this.tok.T_DOC_COMMENT) {
        result.push(this.read_doc_comment());
        continue;
      }

      const locStart = this.position();

      attrs = this.read_attr_list();
      // read member flags
      const flags = this.read_member_flags(true);

      // check constant
      if (this.token == this.tok.T_CONST) {
        const constants = this.read_constant_list(flags, attrs);
        if (this.expect(";")) {
          this.next();
        }
        result = result.concat(constants);
        attrs = [];
      } else if (this.token === this.tok.T_FUNCTION) {
        // reads a function
        const method = this.read_function_declaration(
          2,
          flags,
          attrs,
          locStart
        );
        method.parseFlags(flags);
        result.push(method);
        if (this.expect(";")) {
          this.next();
        }
        attrs = [];
      } else {
        // raise an error
        this.error([this.tok.T_CONST, this.tok.T_FUNCTION]);
        this.next();
      }
    }
    if (this.expect("}")) {
      this.next();
    }
    return result;
  },
  /*
   * reading a trait
   * ```ebnf
   * trait ::= T_TRAIT T_STRING (T_EXTENDS (NAMESPACE_NAME ',')* NAMESPACE_NAME)? '{' FUNCTION* '}'
   * ```
   */
  read_trait_declaration_statement: function () {
    const result = this.node("trait");
    // graceful mode : ignore token & go next
    if (this.token !== this.tok.T_TRAIT) {
      this.error(this.tok.T_TRAIT);
      this.next();
      return null;
    }
    this.next().expect(this.tok.T_STRING);
    let propName = this.node("identifier");
    const name = this.text();
    this.next();
    propName = propName(name);
    this.expect("{");
    const body = this.next().read_class_body(true, false);
    return result(propName, body);
  },
  /*
   * reading a use statement
   * ```ebnf
   * trait_use_statement ::= namespace_name (',' namespace_name)* ('{' trait_use_alias '}')?
   * ```
   */
  read_trait_use_statement: function () {
    // defines use statements
    const node = this.node("traituse");
    this.expect(this.tok.T_USE) && this.next();
    const traits = [this.read_namespace_name()];
    let adaptations = null;
    while (this.token === ",") {
      traits.push(this.next().read_namespace_name());
    }
    if (this.token === "{") {
      adaptations = [];
      // defines alias statements
      while (this.next().token !== this.EOF) {
        if (this.token === "}") break;
        adaptations.push(this.read_trait_use_alias());
        this.expect(";");
      }
      if (this.expect("}")) {
        this.next();
      }
    } else {
      if (this.expect(";")) {
        this.next();
      }
    }
    return node(traits, adaptations);
  },
  /*
   * Reading trait alias
   * ```ebnf
   * trait_use_alias ::= namespace_name ( T_DOUBLE_COLON T_STRING )? (T_INSTEADOF namespace_name) | (T_AS member_flags? T_STRING)
   * ```
   * name list : https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L303
   * trait adaptation : https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L742
   */
  read_trait_use_alias: function () {
    const node = this.node();
    let trait = null;
    let method;

    if (this.is("IDENTIFIER")) {
      method = this.node("identifier");
      const methodName = this.text();
      this.next();
      method = method(methodName);
    } else {
      method = this.read_namespace_name();

      if (this.token === this.tok.T_DOUBLE_COLON) {
        this.next();
        if (
          this.token === this.tok.T_STRING ||
          (this.version >= 700 && this.is("IDENTIFIER"))
        ) {
          trait = method;
          method = this.node("identifier");
          const methodName = this.text();
          this.next();
          method = method(methodName);
        } else {
          this.expect(this.tok.T_STRING);
        }
      } else {
        // convert identifier as string
        method = method.name;
      }
    }

    // handle trait precedence
    if (this.token === this.tok.T_INSTEADOF) {
      return node(
        "traitprecedence",
        trait,
        method,
        this.next().read_name_list()
      );
    } else if (this.token === this.tok.T_AS) {
      // handle trait alias
      let flags = null;
      let alias = null;
      if (this.next().is("T_MEMBER_FLAGS")) {
        flags = this.read_member_flags();
      }

      if (
        this.token === this.tok.T_STRING ||
        (this.version >= 700 && this.is("IDENTIFIER"))
      ) {
        alias = this.node("identifier");
        const name = this.text();
        this.next();
        alias = alias(name);
      } else if (flags === false) {
        // no visibility flags and no name => too bad
        this.expect(this.tok.T_STRING);
      }

      return node("traitalias", trait, method, alias, flags);
    }

    // handle errors
    this.expect([this.tok.T_AS, this.tok.T_INSTEADOF]);
    return node("traitalias", trait, method, null, null);
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var comment$1 = {
  /*
   *  Comments with // or # or / * ... * /
   */
  read_comment: function () {
    const text = this.text();
    let result = this.ast.prepare(
      text.substring(0, 2) === "/*" ? "commentblock" : "commentline",
      null,
      this
    );
    const offset = this.lexer.yylloc.first_offset;
    // handle location on comment
    const prev = this.prev;
    this.prev = [
      this.lexer.yylloc.last_line,
      this.lexer.yylloc.last_column,
      this.lexer.offset,
    ];
    this.lex();
    result = result(text);
    result.offset = offset;
    this.prev = prev;
    return result;
  },
  /*
   * Comments with / ** ... * /
   */
  read_doc_comment: function () {
    let result = this.ast.prepare("commentblock", null, this);
    const offset = this.lexer.yylloc.first_offset;
    const text = this.text();
    const prev = this.prev;
    this.prev = [
      this.lexer.yylloc.last_line,
      this.lexer.yylloc.last_column,
      this.lexer.offset,
    ];
    this.lex();
    result = result(text);
    result.offset = offset;
    this.prev = prev;
    return result;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var expr = {
  read_expr: function (expr) {
    const result = this.node();
    if (this.token === "@") {
      if (!expr) {
        expr = this.next().read_expr();
      }
      return result("silent", expr);
    }
    if (!expr) {
      expr = this.read_expr_item();
    }
    // binary operations
    if (this.token === "|") {
      return result("bin", "|", expr, this.next().read_expr());
    }
    if (this.token === "&") {
      return result("bin", "&", expr, this.next().read_expr());
    }
    if (this.token === "^") {
      return result("bin", "^", expr, this.next().read_expr());
    }
    if (this.token === ".") {
      return result("bin", ".", expr, this.next().read_expr());
    }
    if (this.token === "+") {
      return result("bin", "+", expr, this.next().read_expr());
    }
    if (this.token === "-") {
      return result("bin", "-", expr, this.next().read_expr());
    }
    if (this.token === "*") {
      return result("bin", "*", expr, this.next().read_expr());
    }
    if (this.token === "/") {
      return result("bin", "/", expr, this.next().read_expr());
    }
    if (this.token === "%") {
      return result("bin", "%", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_POW) {
      return result("bin", "**", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_SL) {
      return result("bin", "<<", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_SR) {
      return result("bin", ">>", expr, this.next().read_expr());
    }
    // more binary operations (formerly bool)
    if (this.token === this.tok.T_BOOLEAN_OR) {
      return result("bin", "||", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_LOGICAL_OR) {
      return result("bin", "or", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_BOOLEAN_AND) {
      return result("bin", "&&", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_LOGICAL_AND) {
      return result("bin", "and", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_LOGICAL_XOR) {
      return result("bin", "xor", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_IS_IDENTICAL) {
      return result("bin", "===", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_IS_NOT_IDENTICAL) {
      return result("bin", "!==", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_IS_EQUAL) {
      return result("bin", "==", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_IS_NOT_EQUAL) {
      return result("bin", "!=", expr, this.next().read_expr());
    }
    if (this.token === "<") {
      return result("bin", "<", expr, this.next().read_expr());
    }
    if (this.token === ">") {
      return result("bin", ">", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_IS_SMALLER_OR_EQUAL) {
      return result("bin", "<=", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_IS_GREATER_OR_EQUAL) {
      return result("bin", ">=", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_SPACESHIP) {
      return result("bin", "<=>", expr, this.next().read_expr());
    }
    if (this.token === this.tok.T_INSTANCEOF) {
      expr = result(
        "bin",
        "instanceof",
        expr,
        this.next().read_class_name_reference()
      );
      if (
        this.token !== ";" &&
        this.token !== this.tok.T_INLINE_HTML &&
        this.token !== this.EOF
      ) {
        expr = this.read_expr(expr);
      }
    }

    // extra operations :
    // $username = $_GET['user'] ?? 'nobody';
    if (this.token === this.tok.T_COALESCE) {
      return result("bin", "??", expr, this.next().read_expr());
    }

    // extra operations :
    // $username = $_GET['user'] ? true : false;
    if (this.token === "?") {
      let trueArg = null;
      if (this.next().token !== ":") {
        trueArg = this.read_expr();
      }
      this.expect(":") && this.next();
      return result("retif", expr, trueArg, this.read_expr());
    } else {
      // see #193
      result.destroy(expr);
    }

    return expr;
  },

  /*
   * Reads a cast expression
   */
  read_expr_cast: function (type) {
    return this.node("cast")(type, this.text(), this.next().read_expr());
  },

  /*
   * Read a isset variable
   */
  read_isset_variable: function () {
    return this.read_expr();
  },

  /*
   * Reads isset variables
   */
  read_isset_variables: function () {
    return this.read_function_list(this.read_isset_variable, ",");
  },

  /*
   * Reads internal PHP functions
   */
  read_internal_functions_in_yacc: function () {
    let result = null;
    switch (this.token) {
      case this.tok.T_ISSET:
        {
          result = this.node("isset");
          if (this.next().expect("(")) {
            this.next();
          }
          const variables = this.read_isset_variables();
          if (this.expect(")")) {
            this.next();
          }
          result = result(variables);
        }
        break;
      case this.tok.T_EMPTY:
        {
          result = this.node("empty");
          if (this.next().expect("(")) {
            this.next();
          }
          const expression = this.read_expr();
          if (this.expect(")")) {
            this.next();
          }
          result = result(expression);
        }
        break;
      case this.tok.T_INCLUDE:
        result = this.node("include")(false, false, this.next().read_expr());
        break;
      case this.tok.T_INCLUDE_ONCE:
        result = this.node("include")(true, false, this.next().read_expr());
        break;
      case this.tok.T_EVAL:
        {
          result = this.node("eval");
          if (this.next().expect("(")) {
            this.next();
          }
          const expr = this.read_expr();
          if (this.expect(")")) {
            this.next();
          }
          result = result(expr);
        }
        break;
      case this.tok.T_REQUIRE:
        result = this.node("include")(false, true, this.next().read_expr());
        break;
      case this.tok.T_REQUIRE_ONCE:
        result = this.node("include")(true, true, this.next().read_expr());
        break;
    }

    return result;
  },

  /*
   * Reads optional expression
   */
  read_optional_expr: function (stopToken) {
    if (this.token !== stopToken) {
      return this.read_expr();
    }

    return null;
  },

  /*
   * Reads exit expression
   */
  read_exit_expr: function () {
    let expression = null;

    if (this.token === "(") {
      this.next();
      expression = this.read_optional_expr(")");
      this.expect(")") && this.next();
    }

    return expression;
  },

  /*
   * ```ebnf
   * Reads an expression
   *  expr ::= @todo
   * ```
   */
  read_expr_item: function () {
    let result,
      expr,
      attrs = [];
    if (this.token === "+") {
      return this.node("unary")("+", this.next().read_expr());
    }
    if (this.token === "-") {
      return this.node("unary")("-", this.next().read_expr());
    }
    if (this.token === "!") {
      return this.node("unary")("!", this.next().read_expr());
    }
    if (this.token === "~") {
      return this.node("unary")("~", this.next().read_expr());
    }

    if (this.token === "(") {
      expr = this.next().read_expr();
      expr.parenthesizedExpression = true;
      this.expect(")") && this.next();
      return this.handleDereferencable(expr);
    }

    if (this.token === "`") {
      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1048
      return this.read_encapsed_string("`");
    }

    if (this.token === this.tok.T_LIST) {
      let assign = null;
      const isInner = this.innerList;
      result = this.node("list");
      if (!isInner) {
        assign = this.node("assign");
      }
      if (this.next().expect("(")) {
        this.next();
      }

      if (!this.innerList) this.innerList = true;

      // reads inner items
      const assignList = this.read_array_pair_list(false);
      if (this.expect(")")) {
        this.next();
      }

      // check if contains at least one assignment statement
      let hasItem = false;
      for (let i = 0; i < assignList.length; i++) {
        if (assignList[i] !== null && assignList[i].kind !== "noop") {
          hasItem = true;
          break;
        }
      }
      if (!hasItem) {
        /* istanbul ignore next */
        this.raiseError(
          "Fatal Error :  Cannot use empty list on line " +
            this.lexer.yylloc.first_line
        );
      }

      // handles the node resolution
      if (!isInner) {
        this.innerList = false;
        if (this.expect("=")) {
          return assign(
            result(assignList, false),
            this.next().read_expr(),
            "="
          );
        } else {
          // error fallback : list($a, $b);
          /* istanbul ignore next */
          return result(assignList, false);
        }
      } else {
        return result(assignList, false);
      }
    }

    if (this.token === this.tok.T_ATTRIBUTE) {
      attrs = this.read_attr_list();
    }

    if (this.token === this.tok.T_CLONE) {
      return this.node("clone")(this.next().read_expr());
    }

    switch (this.token) {
      case this.tok.T_INC:
        return this.node("pre")("+", this.next().read_variable(false, false));

      case this.tok.T_DEC:
        return this.node("pre")("-", this.next().read_variable(false, false));

      case this.tok.T_NEW:
        return this.read_new_expr();

      case this.tok.T_ISSET:
      case this.tok.T_EMPTY:
      case this.tok.T_INCLUDE:
      case this.tok.T_INCLUDE_ONCE:
      case this.tok.T_EVAL:
      case this.tok.T_REQUIRE:
      case this.tok.T_REQUIRE_ONCE:
        return this.read_internal_functions_in_yacc();

      case this.tok.T_MATCH:
        return this.read_match_expression();
      case this.tok.T_INT_CAST:
        return this.read_expr_cast("int");

      case this.tok.T_DOUBLE_CAST:
        return this.read_expr_cast("float");

      case this.tok.T_STRING_CAST:
        return this.read_expr_cast(
          this.text().indexOf("binary") !== -1 ? "binary" : "string"
        );

      case this.tok.T_ARRAY_CAST:
        return this.read_expr_cast("array");

      case this.tok.T_OBJECT_CAST:
        return this.read_expr_cast("object");

      case this.tok.T_BOOL_CAST:
        return this.read_expr_cast("bool");

      case this.tok.T_UNSET_CAST:
        return this.read_expr_cast("unset");

      case this.tok.T_THROW: {
        if (this.version < 800) {
          this.raiseError("PHP 8+ is required to use throw as an expression");
        }
        const result = this.node("throw");
        const expr = this.next().read_expr();
        return result(expr);
      }
      case this.tok.T_EXIT: {
        const useDie = this.lexer.yytext.toLowerCase() === "die";
        result = this.node("exit");
        this.next();
        const expression = this.read_exit_expr();
        return result(expression, useDie);
      }

      case this.tok.T_PRINT:
        return this.node("print")(this.next().read_expr());

      // T_YIELD (expr (T_DOUBLE_ARROW expr)?)?
      case this.tok.T_YIELD: {
        let value = null;
        let key = null;
        result = this.node("yield");
        if (this.next().is("EXPR")) {
          // reads the yield return value
          value = this.read_expr();
          if (this.token === this.tok.T_DOUBLE_ARROW) {
            // reads the yield returned key
            key = value;
            value = this.next().read_expr();
          }
        }
        return result(value, key);
      }

      // T_YIELD_FROM expr
      case this.tok.T_YIELD_FROM:
        result = this.node("yieldfrom");
        expr = this.next().read_expr();
        return result(expr);

      case this.tok.T_FN:
      case this.tok.T_FUNCTION:
        return this.read_inline_function(undefined, attrs);

      case this.tok.T_STATIC: {
        const backup = [this.token, this.lexer.getState()];
        this.next();
        if (
          this.token === this.tok.T_FUNCTION ||
          (this.version >= 704 && this.token === this.tok.T_FN)
        ) {
          // handles static function
          return this.read_inline_function([0, 1, 0], attrs);
        } else {
          // rollback
          this.lexer.tokens.push(backup);
          this.next();
        }
      }
    }

    // SCALAR | VARIABLE
    if (this.is("VARIABLE")) {
      result = this.node();
      expr = this.read_variable(false, false);

      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L877
      // should accept only a variable
      const isConst =
        expr.kind === "identifier" ||
        (expr.kind === "staticlookup" && expr.offset.kind === "identifier");

      // VARIABLES SPECIFIC OPERATIONS
      switch (this.token) {
        case "=": {
          if (isConst) this.error("VARIABLE");
          if (this.next().token == "&") {
            return this.read_assignref(result, expr);
          }
          return result("assign", expr, this.read_expr(), "=");
        }

        // operations :
        case this.tok.T_PLUS_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "+=");

        case this.tok.T_MINUS_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "-=");

        case this.tok.T_MUL_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "*=");

        case this.tok.T_POW_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "**=");

        case this.tok.T_DIV_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "/=");

        case this.tok.T_CONCAT_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), ".=");

        case this.tok.T_MOD_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "%=");

        case this.tok.T_AND_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "&=");

        case this.tok.T_OR_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "|=");

        case this.tok.T_XOR_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "^=");

        case this.tok.T_SL_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "<<=");

        case this.tok.T_SR_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), ">>=");

        case this.tok.T_COALESCE_EQUAL:
          if (isConst) this.error("VARIABLE");
          return result("assign", expr, this.next().read_expr(), "??=");

        case this.tok.T_INC:
          if (isConst) this.error("VARIABLE");
          this.next();
          return result("post", "+", expr);
        case this.tok.T_DEC:
          if (isConst) this.error("VARIABLE");
          this.next();
          return result("post", "-", expr);
        default:
          // see #193
          result.destroy(expr);
      }
    } else if (this.is("SCALAR")) {
      result = this.node();
      expr = this.read_scalar();
      if (expr.kind === "array" && expr.shortForm && this.token === "=") {
        // list assign
        const list = this.convertToList(expr);
        if (expr.loc) list.loc = expr.loc;
        const right = this.next().read_expr();
        return result("assign", list, right, "=");
      } else {
        // see #189 - swap docs on nodes
        result.destroy(expr);
      }
      // classic array
      return this.handleDereferencable(expr);
    } else {
      this.error("EXPR");
      this.next();
    }

    // returns variable | scalar
    return expr;
  },

  /*
   * Recursively convert nested array to nested list.
   */
  convertToList: function (array) {
    const convertedItems = array.items.map((entry) => {
      if (
        entry.value &&
        entry.value.kind === "array" &&
        entry.value.shortForm
      ) {
        entry.value = this.convertToList(entry.value);
      }
      return entry;
    });
    const node = this.node("list")(convertedItems, true);
    if (array.loc) node.loc = array.loc;
    if (array.leadingComments) node.leadingComments = array.leadingComments;
    if (array.trailingComments) node.trailingComments = array.trailingComments;
    return node;
  },

  /*
   * Reads assignment
   * @param {*} left
   */
  read_assignref: function (result, left) {
    this.next();
    let right;
    if (this.token === this.tok.T_NEW) {
      if (this.version >= 700) {
        this.error();
      }
      right = this.read_new_expr();
    } else {
      right = this.read_variable(false, false);
    }

    return result("assignref", left, right);
  },

  /*
   *
   * inline_function:
   * 		function returns_ref backup_doc_comment '(' parameter_list ')' lexical_vars return_type
   * 		backup_fn_flags '{' inner_statement_list '}' backup_fn_flags
   * 			{ $$ = zend_ast_create_decl(ZEND_AST_CLOSURE, $2 | $13, $1, $3,
   * 				  zend_string_init("{closure}", sizeof("{closure}") - 1, 0),
   * 				  $5, $7, $11, $8); CG(extra_fn_flags) = $9; }
   * 	|	fn returns_ref '(' parameter_list ')' return_type backup_doc_comment T_DOUBLE_ARROW backup_fn_flags backup_lex_pos expr backup_fn_flags
   * 			{ $$ = zend_ast_create_decl(ZEND_AST_ARROW_FUNC, $2 | $12, $1, $7,
   * 				  zend_string_init("{closure}", sizeof("{closure}") - 1, 0), $4, NULL,
   * 				  zend_ast_create(ZEND_AST_RETURN, $11), $6);
   * 				  ((zend_ast_decl *) $$)->lex_pos = $10;
   * 				  CG(extra_fn_flags) = $9; }   *
   */
  read_inline_function: function (flags, attrs) {
    if (this.token === this.tok.T_FUNCTION) {
      const result = this.read_function(true, flags, attrs);
      result.attrGroups = attrs;
      return result;
    }
    // introduced in PHP 7.4
    if (!this.version >= 704) {
      this.raiseError("Arrow Functions are not allowed");
    }
    // as an arrowfunc
    const node = this.node("arrowfunc");
    // eat T_FN
    if (this.expect(this.tok.T_FN)) this.next();
    // check the &
    const isRef = this.is_reference();
    // ...
    if (this.expect("(")) this.next();
    const params = this.read_parameter_list();
    if (this.expect(")")) this.next();
    let nullable = false;
    let returnType = null;
    if (this.token === ":") {
      if (this.next().token === "?") {
        nullable = true;
        this.next();
      }
      returnType = this.read_types();
    }
    if (this.expect(this.tok.T_DOUBLE_ARROW)) this.next();
    const body = this.read_expr();
    const result = node(
      params,
      isRef,
      body,
      returnType,
      nullable,
      flags ? true : false
    );
    result.attrGroups = attrs;
    return result;
  },

  read_match_expression: function () {
    const node = this.node("match");
    this.expect(this.tok.T_MATCH) && this.next();
    if (this.version < 800) {
      this.raiseError("Match statements are not allowed before PHP 8");
    }
    let cond = null;
    let arms = [];
    if (this.expect("(")) this.next();
    cond = this.read_expr();
    if (this.expect(")")) this.next();
    if (this.expect("{")) this.next();
    arms = this.read_match_arms();
    if (this.expect("}")) this.next();
    return node(cond, arms);
  },

  read_match_arms: function () {
    return this.read_list(() => this.read_match_arm(), ",", true);
  },

  read_match_arm: function () {
    if (this.token === "}") {
      return;
    }
    return this.node("matcharm")(this.read_match_arm_conds(), this.read_expr());
  },

  read_match_arm_conds: function () {
    let conds = [];
    if (this.token === this.tok.T_DEFAULT) {
      conds = null;
      this.next();
    } else {
      conds.push(this.read_expr());
      while (this.token === ",") {
        this.next();
        if (this.token === this.tok.T_DOUBLE_ARROW) {
          this.next();
          return conds;
        }
        conds.push(this.read_expr());
      }
    }
    if (this.expect(this.tok.T_DOUBLE_ARROW)) {
      this.next();
    }
    return conds;
  },

  read_attribute() {
    const name = this.text();
    let args = [];
    this.next();
    if (this.token === "(") {
      args = this.read_argument_list();
    }
    return this.node("attribute")(name, args);
  },
  read_attr_list() {
    const list = [];
    if (this.token === this.tok.T_ATTRIBUTE) {
      do {
        const attrGr = this.node("attrgroup")([]);
        this.next();
        attrGr.attrs.push(this.read_attribute());
        while (this.token === ",") {
          this.next();
          if (this.token !== "]") attrGr.attrs.push(this.read_attribute());
        }
        list.push(attrGr);
        this.expect("]");
        this.next();
      } while (this.token === this.tok.T_ATTRIBUTE);
    }
    return list;
  },

  /*
   * ```ebnf
   *    new_expr ::= T_NEW (namespace_name function_argument_list) | (T_CLASS ... class declaration)
   * ```
   * https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L850
   */
  read_new_expr: function () {
    const result = this.node("new");
    this.expect(this.tok.T_NEW) && this.next();
    let args = [];
    if (this.token === "(") {
      this.next();
      const newExp = this.read_expr();
      this.expect(")");
      this.next();
      if (this.token === "(") {
        args = this.read_argument_list();
      }
      return result(newExp, args);
    }
    const attrs = this.read_attr_list();
    if (this.token === this.tok.T_CLASS) {
      const what = this.node("class");
      // Annonymous class declaration
      if (this.next().token === "(") {
        args = this.read_argument_list();
      }
      const propExtends = this.read_extends_from();
      const propImplements = this.read_implements_list();
      let body = null;
      if (this.expect("{")) {
        body = this.next().read_class_body(true, false);
      }
      const whatNode = what(null, propExtends, propImplements, body, [0, 0, 0]);
      whatNode.attrGroups = attrs;
      return result(whatNode, args);
    }
    // Already existing class
    let name = this.read_new_class_name();
    while (this.token === "[") {
      const offsetNode = this.node("offsetlookup");
      const offset = this.next().read_encaps_var_offset();
      this.expect("]") && this.next();
      name = offsetNode(name, offset);
    }
    if (this.token === "(") {
      args = this.read_argument_list();
    }
    return result(name, args);
  },
  /*
   * Reads a class name
   * ```ebnf
   * read_new_class_name ::= namespace_name | variable
   * ```
   */
  read_new_class_name: function () {
    if (
      this.token === this.tok.T_NS_SEPARATOR ||
      this.token === this.tok.T_NAME_RELATIVE ||
      this.token === this.tok.T_NAME_QUALIFIED ||
      this.token === this.tok.T_NAME_FULLY_QUALIFIED ||
      this.token === this.tok.T_STRING ||
      this.token === this.tok.T_NAMESPACE
    ) {
      let result = this.read_namespace_name(true);
      if (this.token === this.tok.T_DOUBLE_COLON) {
        result = this.read_static_getter(result);
      }
      return result;
    } else if (this.is("VARIABLE")) {
      return this.read_variable(true, false);
    } else {
      this.expect([this.tok.T_STRING, "VARIABLE"]);
    }
  },
  handleDereferencable: function (expr) {
    while (this.token !== this.EOF) {
      if (
        this.token === this.tok.T_OBJECT_OPERATOR ||
        this.token === this.tok.T_DOUBLE_COLON
      ) {
        expr = this.recursive_variable_chain_scan(expr, false, false, true);
      } else if (this.token === this.tok.T_CURLY_OPEN || this.token === "[") {
        expr = this.read_dereferencable(expr);
      } else if (this.token === "(") {
        // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1118
        expr = this.node("call")(expr, this.read_argument_list());
      } else {
        return expr;
      }
    }
    return expr;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var _enum$1 = {
  /*
   * reading an enum
   * ```ebnf
   * enum ::= enum_scope? T_ENUM T_STRING (':' NAMESPACE_NAME)? (T_IMPLEMENTS (NAMESPACE_NAME ',')* NAMESPACE_NAME)? '{' ENUM_BODY '}'
   * ```
   */
  read_enum_declaration_statement: function (attrs) {
    const result = this.node("enum");
    // graceful mode : ignore token & go next
    if (!this.expect(this.tok.T_ENUM)) {
      return null;
    }
    this.next().expect(this.tok.T_STRING);
    let propName = this.node("identifier");
    const name = this.text();
    this.next();
    propName = propName(name);
    const valueType = this.read_enum_value_type();
    const propImplements = this.read_implements_list();
    this.expect("{");
    const body = this.next().read_class_body(false, true);
    const node = result(propName, valueType, propImplements, body);
    if (attrs) node.attrGroups = attrs;
    return node;
  },

  read_enum_value_type: function () {
    if (this.token === ":") {
      return this.next().read_namespace_name();
    }

    return null;
  },

  read_enum_case: function () {
    this.expect(this.tok.T_CASE);
    const result = this.node("enumcase");
    let caseName = this.node("identifier");
    const name = this.next().text();
    this.next();
    caseName = caseName(name);

    const value = this.token === "=" ? this.next().read_expr() : null;
    this.expect(";");

    return result(caseName, value);
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var _function$1 = {
  /*
   * checks if current token is a reference keyword
   */
  is_reference: function () {
    if (this.token === "&") {
      this.next();
      return true;
    }
    return false;
  },
  /*
   * checks if current token is a variadic keyword
   */
  is_variadic: function () {
    if (this.token === this.tok.T_ELLIPSIS) {
      this.next();
      return true;
    }
    return false;
  },
  /*
   * reading a function
   * ```ebnf
   * function ::= function_declaration code_block
   * ```
   */
  read_function: function (closure, flag, attrs, locStart) {
    const result = this.read_function_declaration(
      closure ? 1 : flag ? 2 : 0,
      flag && flag[1] === 1,
      attrs || [],
      locStart
    );
    if (flag && flag[2] == 1) {
      // abstract function :
      result.parseFlags(flag);
      if (this.expect(";")) {
        this.next();
      }
    } else {
      if (this.expect("{")) {
        result.body = this.read_code_block(false);
        if (result.loc && result.body.loc) {
          result.loc.end = result.body.loc.end;
        }
      }
      if (!closure && flag) {
        result.parseFlags(flag);
      }
    }
    return result;
  },
  /*
   * reads a function declaration (without his body)
   * ```ebnf
   * function_declaration ::= T_FUNCTION '&'?  T_STRING '(' parameter_list ')'
   * ```
   */
  read_function_declaration: function (type, isStatic, attrs, locStart) {
    let nodeName = "function";
    if (type === 1) {
      nodeName = "closure";
    } else if (type === 2) {
      nodeName = "method";
    }
    const result = this.node(nodeName);

    if (this.expect(this.tok.T_FUNCTION)) {
      this.next();
    }
    const isRef = this.is_reference();
    let name = false,
      use = [],
      returnType = null,
      nullable = false;
    if (type !== 1) {
      const nameNode = this.node("identifier");
      if (type === 2) {
        if (this.version >= 700) {
          if (this.token === this.tok.T_STRING || this.is("IDENTIFIER")) {
            name = this.text();
            this.next();
          } else if (this.version < 704) {
            this.error("IDENTIFIER");
          }
        } else if (this.token === this.tok.T_STRING) {
          name = this.text();
          this.next();
        } else {
          this.error("IDENTIFIER");
        }
      } else {
        if (this.version >= 700) {
          if (this.token === this.tok.T_STRING) {
            name = this.text();
            this.next();
          } else if (this.version >= 704) {
            if (!this.expect("(")) {
              this.next();
            }
          } else {
            this.error(this.tok.T_STRING);
            this.next();
          }
        } else {
          if (this.expect(this.tok.T_STRING)) {
            name = this.text();
          }
          this.next();
        }
      }
      name = nameNode(name);
    }
    if (this.expect("(")) this.next();
    const params = this.read_parameter_list(name.name === "__construct");
    if (this.expect(")")) this.next();
    if (type === 1) {
      use = this.read_lexical_vars();
    }
    if (this.token === ":") {
      if (this.next().token === "?") {
        nullable = true;
        this.next();
      }
      returnType = this.read_types();
    }
    const apply_attrgroup_location = (node) => {
      node.attrGroups = attrs || [];

      if (locStart && node.loc) {
        node.loc.start = locStart;
        if (node.loc.source) {
          node.loc.source = this.lexer._input.substr(
            node.loc.start.offset,
            node.loc.end.offset - node.loc.start.offset
          );
        }
      }
      return node;
    };

    if (type === 1) {
      // closure
      return apply_attrgroup_location(
        result(params, isRef, use, returnType, nullable, isStatic)
      );
    }
    return apply_attrgroup_location(
      result(name, params, isRef, returnType, nullable)
    );
  },

  read_lexical_vars: function () {
    let result = [];

    if (this.token === this.tok.T_USE) {
      this.next();
      this.expect("(") && this.next();
      result = this.read_lexical_var_list();
      this.expect(")") && this.next();
    }

    return result;
  },

  read_list_with_dangling_comma: function (item) {
    const result = [];

    while (this.token != this.EOF) {
      result.push(item());
      if (this.token == ",") {
        this.next();
        if (this.version >= 800 && this.token === ")") {
          return result;
        }
      } else if (this.token == ")") {
        break;
      } else {
        this.error([",", ")"]);
        break;
      }
    }
    return result;
  },

  read_lexical_var_list: function () {
    return this.read_list_with_dangling_comma(this.read_lexical_var.bind(this));
  },

  /*
   * ```ebnf
   * lexical_var ::= '&'? T_VARIABLE
   * ```
   */
  read_lexical_var: function () {
    if (this.token === "&") {
      return this.read_byref(this.read_lexical_var.bind(this));
    }
    const result = this.node("variable");
    this.expect(this.tok.T_VARIABLE);
    const name = this.text().substring(1);
    this.next();
    return result(name, false);
  },
  /*
   * reads a list of parameters
   * ```ebnf
   *  parameter_list ::= (parameter ',')* parameter?
   * ```
   */
  read_parameter_list: function (is_class_constructor) {
    if (this.token !== ")") {
      let wasVariadic = false;

      return this.read_list_with_dangling_comma(
        function () {
          const parameter = this.read_parameter(is_class_constructor);
          if (parameter) {
            // variadic parameters can only be defined at the end of the parameter list
            if (wasVariadic) {
              this.raiseError(
                "Unexpected parameter after a variadic parameter"
              );
            }
            if (parameter.variadic) {
              wasVariadic = true;
            }
          }
          return parameter;
        }.bind(this),
        ","
      );
    }

    return [];
  },
  /*
   * ```ebnf
   *  parameter ::= type? '&'? T_ELLIPSIS? T_VARIABLE ('=' expr)?
   * ```
   * @see https://github.com/php/php-src/blob/493524454d66adde84e00d249d607ecd540de99f/Zend/zend_language_parser.y#L640
   */
  read_parameter: function (is_class_constructor) {
    const node = this.node("parameter");
    let parameterName = null;
    let value = null;
    let types = null;
    let nullable = false;
    let readonly = false;
    let attrs = [];
    if (this.token === this.tok.T_ATTRIBUTE) attrs = this.read_attr_list();

    if (this.version >= 801 && this.token === this.tok.T_READ_ONLY) {
      if (is_class_constructor) {
        this.next();
        readonly = true;
      } else {
        this.raiseError(
          "readonly properties can be used only on class constructor"
        );
      }
    }

    const flags = this.read_promoted();

    if (
      !readonly &&
      this.version >= 801 &&
      this.token === this.tok.T_READ_ONLY
    ) {
      if (is_class_constructor) {
        this.next();
        readonly = true;
      } else {
        this.raiseError(
          "readonly properties can be used only on class constructor"
        );
      }
    }

    if (this.token === "?") {
      this.next();
      nullable = true;
    }
    types = this.read_types();
    if (nullable && !types) {
      this.raiseError(
        "Expecting a type definition combined with nullable operator"
      );
    }
    const isRef = this.is_reference();
    const isVariadic = this.is_variadic();
    if (this.expect(this.tok.T_VARIABLE)) {
      parameterName = this.node("identifier");
      const name = this.text().substring(1);
      this.next();
      parameterName = parameterName(name);
    }
    if (this.token == "=") {
      value = this.next().read_expr();
    }
    const result = node(
      parameterName,
      types,
      value,
      isRef,
      isVariadic,
      readonly,
      nullable,
      flags
    );
    if (attrs) result.attrGroups = attrs;
    return result;
  },
  read_types() {
    const MODE_UNSET = "unset";
    const MODE_UNION = "union";
    const MODE_INTERSECTION = "intersection";

    const types = [];
    let mode = MODE_UNSET;
    const type = this.read_type();
    if (!type) return null;

    // we have matched a single type
    types.push(type);

    // is the current token a:
    // - | for union type
    // - & for intersection type (> php 8.1)
    while (this.token === "|" || (this.version >= 801 && this.token === "&")) {
      const nextToken = this.peek();

      if (
        nextToken === this.tok.T_ELLIPSIS ||
        nextToken === this.tok.T_VARIABLE
      ) {
        // the next token is part of the variable (or the variable itself),
        // we're not gonna match anymore types
        break;
      }

      if (mode === MODE_UNSET) {
        // are we in union or intersection "mode"
        mode = this.token === "|" ? MODE_UNION : MODE_INTERSECTION;
      } else {
        // it is not possible to mix "modes"
        if (
          (mode === MODE_UNION && this.token !== "|") ||
          (mode === MODE_INTERSECTION && this.token !== "&")
        ) {
          this.raiseError(
            'Unexpect token "' + this.token + '", "|" and "&" can not be mixed'
          );
        }
      }

      this.next();
      types.push(this.read_type());
    }
    if (types.length === 1) {
      return types[0];
    } else {
      return mode === MODE_INTERSECTION
        ? this.node("intersectiontype")(types)
        : this.node("uniontype")(types);
    }
  },
  read_promoted() {
    const MODIFIER_PUBLIC = 1;
    const MODIFIER_PROTECTED = 2;
    const MODIFIER_PRIVATE = 4;
    if (this.token === this.tok.T_PUBLIC) {
      this.next();
      return MODIFIER_PUBLIC;
    } else if (this.token === this.tok.T_PROTECTED) {
      this.next();
      return MODIFIER_PROTECTED;
    } else if (this.token === this.tok.T_PRIVATE) {
      this.next();
      return MODIFIER_PRIVATE;
    }
    return 0;
  },
  /*
   * Reads a list of arguments
   * ```ebnf
   *  function_argument_list ::= '(' (argument_list (',' argument_list)*)? ')'
   * ```
   */
  read_argument_list: function () {
    let result = [];
    this.expect("(") && this.next();
    if (
      this.version >= 801 &&
      this.token === this.tok.T_ELLIPSIS &&
      this.peek() === ")"
    ) {
      result.push(this.node("variadicplaceholder")());
      this.next();
    } else if (this.token !== ")") {
      result = this.read_non_empty_argument_list();
    }
    this.expect(")") && this.next();
    return result;
  },
  /*
   * Reads non empty argument list
   */
  read_non_empty_argument_list: function () {
    let wasVariadic = false;

    return this.read_function_list(
      function () {
        const argument = this.read_argument();
        if (argument) {
          const isVariadic = argument.kind === "variadic";
          // variadic arguments can only be followed by other variadic arguments
          if (wasVariadic && !isVariadic) {
            this.raiseError(
              "Unexpected non-variadic argument after a variadic argument"
            );
          }
          if (isVariadic) {
            wasVariadic = true;
          }
        }
        return argument;
      }.bind(this),
      ","
    );
  },
  /*
   * ```ebnf
   *    argument_list ::= T_STRING ':' expr | T_ELLIPSIS? expr
   * ```
   */
  read_argument: function () {
    if (this.token === this.tok.T_ELLIPSIS) {
      return this.node("variadic")(this.next().read_expr());
    }
    if (
      this.token === this.tok.T_STRING ||
      Object.values(this.lexer.keywords).includes(this.token)
    ) {
      const nextToken = this.peek();
      if (nextToken === ":") {
        if (this.version < 800) {
          this.raiseError("PHP 8+ is required to use named arguments");
        }
        return this.node("namedargument")(
          this.text(),
          this.next().next().read_expr()
        );
      }
    }
    return this.read_expr();
  },
  /*
   * read type hinting
   * ```ebnf
   *  type ::= T_ARRAY | T_CALLABLE | namespace_name
   * ```
   */
  read_type: function () {
    const result = this.node();
    if (this.token === this.tok.T_ARRAY || this.token === this.tok.T_CALLABLE) {
      const type = this.text();
      this.next();
      return result("typereference", type.toLowerCase(), type);
    } else if (
      this.token === this.tok.T_NAME_RELATIVE ||
      this.token === this.tok.T_NAME_QUALIFIED ||
      this.token === this.tok.T_NAME_FULLY_QUALIFIED ||
      this.token === this.tok.T_STRING ||
      this.token === this.tok.T_STATIC
    ) {
      const type = this.text();
      const backup = [this.token, this.lexer.getState()];
      this.next();
      if (
        this.token !== this.tok.T_NS_SEPARATOR &&
        this.ast.typereference.types.indexOf(type.toLowerCase()) > -1
      ) {
        return result("typereference", type.toLowerCase(), type);
      } else {
        // rollback a classic namespace
        this.lexer.tokens.push(backup);
        this.next();
        // fix : destroy not consumed node (release comments)
        result.destroy();
        return this.read_namespace_name();
      }
    }
    // fix : destroy not consumed node (release comments)
    result.destroy();
    return null;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var _if$1 = {
  /*
   * Reads an IF statement
   *
   * ```ebnf
   *  if ::= T_IF '(' expr ')' ':' ...
   * ```
   */
  read_if: function () {
    const result = this.node("if");
    const test = this.next().read_if_expr();
    let body = null;
    let alternate = null;
    let shortForm = false;

    if (this.token === ":") {
      shortForm = true;
      this.next();
      body = this.node("block");
      const items = [];
      while (this.token !== this.EOF && this.token !== this.tok.T_ENDIF) {
        if (this.token === this.tok.T_ELSEIF) {
          alternate = this.read_elseif_short();
          break;
        } else if (this.token === this.tok.T_ELSE) {
          alternate = this.read_else_short();
          break;
        }
        items.push(this.read_inner_statement());
      }
      body = body(null, items);
      this.expect(this.tok.T_ENDIF) && this.next();
      this.expectEndOfStatement();
    } else {
      body = this.read_statement();
      if (this.token === this.tok.T_ELSEIF) {
        alternate = this.read_if();
      } else if (this.token === this.tok.T_ELSE) {
        alternate = this.next().read_statement();
      }
    }
    return result(test, body, alternate, shortForm);
  },
  /*
   * reads an if expression : '(' expr ')'
   */
  read_if_expr: function () {
    this.expect("(") && this.next();
    const result = this.read_expr();
    this.expect(")") && this.next();
    return result;
  },
  /*
   * reads an elseif (expr): statements
   */
  read_elseif_short: function () {
    let alternate = null;
    const result = this.node("if");
    const test = this.next().read_if_expr();
    if (this.expect(":")) this.next();
    const body = this.node("block");
    const items = [];
    while (this.token != this.EOF && this.token !== this.tok.T_ENDIF) {
      if (this.token === this.tok.T_ELSEIF) {
        alternate = this.read_elseif_short();
        break;
      } else if (this.token === this.tok.T_ELSE) {
        alternate = this.read_else_short();
        break;
      }
      items.push(this.read_inner_statement());
    }
    return result(test, body(null, items), alternate, true);
  },
  /*
   *
   */
  read_else_short: function () {
    if (this.next().expect(":")) this.next();
    const body = this.node("block");
    const items = [];
    while (this.token != this.EOF && this.token !== this.tok.T_ENDIF) {
      items.push(this.read_inner_statement());
    }
    return body(null, items);
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var loops = {
  /*
   * Reads a while statement
   * ```ebnf
   * while ::= T_WHILE (statement | ':' inner_statement_list T_ENDWHILE ';')
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L587
   * @return {While}
   */
  read_while: function () {
    const result = this.node("while");
    this.expect(this.tok.T_WHILE) && this.next();
    let test = null;
    let body = null;
    let shortForm = false;
    if (this.expect("(")) this.next();
    test = this.read_expr();
    if (this.expect(")")) this.next();
    if (this.token === ":") {
      shortForm = true;
      body = this.read_short_form(this.tok.T_ENDWHILE);
    } else {
      body = this.read_statement();
    }
    return result(test, body, shortForm);
  },
  /*
   * Reads a do / while loop
   * ```ebnf
   * do ::= T_DO statement T_WHILE '(' expr ')' ';'
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L423
   * @return {Do}
   */
  read_do: function () {
    const result = this.node("do");
    this.expect(this.tok.T_DO) && this.next();
    let test = null;
    let body = null;
    body = this.read_statement();
    if (this.expect(this.tok.T_WHILE)) {
      if (this.next().expect("(")) this.next();
      test = this.read_expr();
      if (this.expect(")")) this.next();
      if (this.expect(";")) this.next();
    }
    return result(test, body);
  },
  /*
   * Read a for incremental loop
   * ```ebnf
   * for ::= T_FOR '(' for_exprs ';' for_exprs ';' for_exprs ')' for_statement
   * for_statement ::= statement | ':' inner_statement_list T_ENDFOR ';'
   * for_exprs ::= expr? (',' expr)*
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L425
   * @return {For}
   */
  read_for: function () {
    const result = this.node("for");
    this.expect(this.tok.T_FOR) && this.next();
    let init = [];
    let test = [];
    let increment = [];
    let body = null;
    let shortForm = false;
    if (this.expect("(")) this.next();
    if (this.token !== ";") {
      init = this.read_list(this.read_expr, ",");
      if (this.expect(";")) this.next();
    } else {
      this.next();
    }
    if (this.token !== ";") {
      test = this.read_list(this.read_expr, ",");
      if (this.expect(";")) this.next();
    } else {
      this.next();
    }
    if (this.token !== ")") {
      increment = this.read_list(this.read_expr, ",");
      if (this.expect(")")) this.next();
    } else {
      this.next();
    }
    if (this.token === ":") {
      shortForm = true;
      body = this.read_short_form(this.tok.T_ENDFOR);
    } else {
      body = this.read_statement();
    }
    return result(init, test, increment, body, shortForm);
  },
  /*
   * Reads a foreach loop
   * ```ebnf
   * foreach ::= '(' expr T_AS foreach_variable (T_DOUBLE_ARROW foreach_variable)? ')' statement
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L438
   * @return {Foreach}
   */
  read_foreach: function () {
    const result = this.node("foreach");
    this.expect(this.tok.T_FOREACH) && this.next();
    let source = null;
    let key = null;
    let value = null;
    let body = null;
    let shortForm = false;
    if (this.expect("(")) this.next();
    source = this.read_expr();
    if (this.expect(this.tok.T_AS)) {
      this.next();
      value = this.read_foreach_variable();
      if (this.token === this.tok.T_DOUBLE_ARROW) {
        key = value;
        value = this.next().read_foreach_variable();
      }
    }

    // grammatically correct but not supported by PHP
    if (key && key.kind === "list") {
      this.raiseError("Fatal Error : Cannot use list as key element");
    }

    if (this.expect(")")) this.next();

    if (this.token === ":") {
      shortForm = true;
      body = this.read_short_form(this.tok.T_ENDFOREACH);
    } else {
      body = this.read_statement();
    }
    return result(source, key, value, body, shortForm);
  },
  /*
   * Reads a foreach variable statement
   * ```ebnf
   * foreach_variable =
   *    variable |
   *    '&' variable |
   *    T_LIST '(' assignment_list ')' |
   *    '[' assignment_list ']'
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L544
   * @return {Expression}
   */
  read_foreach_variable: function () {
    if (this.token === this.tok.T_LIST || this.token === "[") {
      const isShort = this.token === "[";
      const result = this.node("list");
      this.next();
      if (!isShort && this.expect("(")) this.next();
      const assignList = this.read_array_pair_list(isShort);
      if (this.expect(isShort ? "]" : ")")) this.next();
      return result(assignList, isShort);
    } else {
      return this.read_variable(false, false);
    }
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var main = {
  /*
   * ```ebnf
   * start ::= (namespace | top_statement)*
   * ```
   */
  read_start: function () {
    if (this.token == this.tok.T_NAMESPACE) {
      return this.read_namespace();
    } else {
      return this.read_top_statement();
    }
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var namespace$1 = {
  /*
   * Reads a namespace declaration block
   * ```ebnf
   * namespace ::= T_NAMESPACE namespace_name? '{'
   *    top_statements
   * '}'
   * | T_NAMESPACE namespace_name ';' top_statements
   * ```
   * @see http://php.net/manual/en/language.namespaces.php
   * @return {Namespace}
   */
  read_namespace: function () {
    const result = this.node("namespace");
    let body;
    this.expect(this.tok.T_NAMESPACE) && this.next();
    let name;

    if (this.token === "{") {
      name = {
        name: [""],
      };
    } else {
      name = this.read_namespace_name();
    }
    this.currentNamespace = name;

    if (this.token === ";") {
      this.currentNamespace = name;
      body = this.next().read_top_statements();
      this.expect(this.EOF);
      return result(name.name, body, false);
    } else if (this.token === "{") {
      this.currentNamespace = name;
      body = this.next().read_top_statements();
      this.expect("}") && this.next();
      if (
        body.length === 0 &&
        this.extractDoc &&
        this._docs.length > this._docIndex
      ) {
        body.push(this.node("noop")());
      }
      return result(name.name, body, true);
    } else {
      this.error(["{", ";"]);
      // graceful mode :
      this.currentNamespace = name;
      body = this.read_top_statements();
      this.expect(this.EOF);
      return result(name, body, false);
    }
  },
  /*
   * Reads a namespace name
   * ```ebnf
   *  namespace_name ::= T_NS_SEPARATOR? (T_STRING T_NS_SEPARATOR)* T_STRING
   * ```
   * @see http://php.net/manual/en/language.namespaces.rules.php
   * @return {Reference}
   */
  read_namespace_name: function (resolveReference) {
    const result = this.node();
    let resolution;
    let name = this.text();
    switch (this.token) {
      case this.tok.T_NAME_RELATIVE:
        resolution = this.ast.name.RELATIVE_NAME;
        name = name.replace(/^namespace\\/, "");
        break;
      case this.tok.T_NAME_QUALIFIED:
        resolution = this.ast.name.QUALIFIED_NAME;
        break;
      case this.tok.T_NAME_FULLY_QUALIFIED:
        resolution = this.ast.name.FULL_QUALIFIED_NAME;
        break;
      default:
        resolution = this.ast.name.UNQUALIFIED_NAME;
        if (!this.expect(this.tok.T_STRING)) {
          // graceful mode
          return result("name", "", this.ast.name.FULL_QUALIFIED_NAME);
        }
    }

    this.next();

    if (resolveReference || this.token !== "(") {
      if (name.toLowerCase() === "parent") {
        return result("parentreference", name);
      } else if (name.toLowerCase() === "self") {
        return result("selfreference", name);
      }
    }

    return result("name", name, resolution);
  },
  /*
   * Reads a use statement
   * ```ebnf
   * use_statement ::= T_USE
   *   use_type? use_declarations |
   *   use_type use_statement '{' use_declarations '}' |
   *   use_statement '{' use_declarations(=>typed) '}'
   * ';'
   * ```
   * @see http://php.net/manual/en/language.namespaces.importing.php
   * @return {UseGroup}
   */
  read_use_statement: function () {
    let result = this.node("usegroup");
    let items = [];
    let name = null;
    this.expect(this.tok.T_USE) && this.next();
    const type = this.read_use_type();
    items.push(this.read_use_declaration(false));
    if (this.token === ",") {
      items = items.concat(this.next().read_use_declarations(false));
    } else if (this.token === "{") {
      name = items[0].name;
      items = this.next().read_use_declarations(type === null);
      this.expect("}") && this.next();
    }
    result = result(name, type, items);
    this.expect(";") && this.next();
    return result;
  },
  /*
   *
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1045
   */
  read_class_name_reference: function () {
    // resolved as the same
    return this.read_variable(true, false);
  },
  /*
   * Reads a use declaration
   * ```ebnf
   * use_declaration ::= use_type? namespace_name use_alias
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L380
   * @return {UseItem}
   */
  read_use_declaration: function (typed) {
    const result = this.node("useitem");
    let type = null;
    if (typed) type = this.read_use_type();
    const name = this.read_namespace_name();
    const alias = this.read_use_alias();
    return result(name.name, alias, type);
  },
  /*
   * Reads a list of use declarations
   * ```ebnf
   * use_declarations ::= use_declaration (',' use_declaration)*
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L380
   * @return {UseItem[]}
   */
  read_use_declarations: function (typed) {
    const result = [this.read_use_declaration(typed)];
    while (this.token === ",") {
      this.next();
      if (typed) {
        if (
          this.token !== this.tok.T_NAME_RELATIVE &&
          this.token !== this.tok.T_NAME_QUALIFIED &&
          this.token !== this.tok.T_NAME_FULLY_QUALIFIED &&
          this.token !== this.tok.T_FUNCTION &&
          this.token !== this.tok.T_CONST &&
          this.token !== this.tok.T_STRING
        ) {
          break;
        }
      } else if (
        this.token !== this.tok.T_NAME_RELATIVE &&
        this.token !== this.tok.T_NAME_QUALIFIED &&
        this.token !== this.tok.T_NAME_FULLY_QUALIFIED &&
        this.token !== this.tok.T_STRING &&
        this.token !== this.tok.T_NS_SEPARATOR
      ) {
        break;
      }
      result.push(this.read_use_declaration(typed));
    }
    return result;
  },
  /*
   * Reads a use statement
   * ```ebnf
   * use_alias ::= (T_AS T_STRING)?
   * ```
   * @return {String|null}
   */
  read_use_alias: function () {
    let result = null;
    if (this.token === this.tok.T_AS) {
      if (this.next().expect(this.tok.T_STRING)) {
        const aliasName = this.node("identifier");
        const name = this.text();
        this.next();
        result = aliasName(name);
      }
    }
    return result;
  },
  /*
   * Reads the namespace type declaration
   * ```ebnf
   * use_type ::= (T_FUNCTION | T_CONST)?
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L335
   * @return {String|null} Possible values : function, const
   */
  read_use_type: function () {
    if (this.token === this.tok.T_FUNCTION) {
      this.next();
      return this.ast.useitem.TYPE_FUNCTION;
    } else if (this.token === this.tok.T_CONST) {
      this.next();
      return this.ast.useitem.TYPE_CONST;
    }
    return null;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const specialChar = {
  "\\": "\\",
  $: "$",
  n: "\n",
  r: "\r",
  t: "\t",
  f: String.fromCharCode(12),
  v: String.fromCharCode(11),
  e: String.fromCharCode(27),
};

var scalar = {
  /*
   * Unescape special chars
   */
  resolve_special_chars: function (text, doubleQuote) {
    if (!doubleQuote) {
      // single quote fix
      return text.replace(/\\\\/g, "\\").replace(/\\'/g, "'");
    }
    return text
      .replace(/\\"/, '"')
      .replace(
        /\\([\\$nrtfve]|[xX][0-9a-fA-F]{1,2}|[0-7]{1,3}|u{([0-9a-fA-F]+)})/g,
        ($match, p1, p2) => {
          if (specialChar[p1]) {
            return specialChar[p1];
          } else if ("x" === p1[0] || "X" === p1[0]) {
            return String.fromCodePoint(parseInt(p1.substr(1), 16));
          } else if ("u" === p1[0]) {
            return String.fromCodePoint(parseInt(p2, 16));
          } else {
            return String.fromCodePoint(parseInt(p1, 8));
          }
        }
      );
  },

  /*
   * Remove all leading spaces each line for heredoc text if there is a indentation
   * @param {string} text
   * @param {number} indentation
   * @param {boolean} indentation_uses_spaces
   * @param {boolean} first_encaps_node if it is behind a variable, the first N spaces should not be removed
   */
  remove_heredoc_leading_whitespace_chars: function (
    text,
    indentation,
    indentation_uses_spaces,
    first_encaps_node
  ) {
    if (indentation === 0) {
      return text;
    }

    this.check_heredoc_indentation_level(
      text,
      indentation,
      indentation_uses_spaces,
      first_encaps_node
    );

    const matchedChar = indentation_uses_spaces ? " " : "\t";
    const removementRegExp = new RegExp(
      `\\n${matchedChar}{${indentation}}`,
      "g"
    );
    const removementFirstEncapsNodeRegExp = new RegExp(
      `^${matchedChar}{${indentation}}`
    );

    // Rough replace, need more check
    if (first_encaps_node) {
      // Remove text leading whitespace
      text = text.replace(removementFirstEncapsNodeRegExp, "");
    }

    // Remove leading whitespace after \n
    return text.replace(removementRegExp, "\n");
  },

  /*
   * Check indentation level of heredoc in text, if mismatch, raiseError
   * @param {string} text
   * @param {number} indentation
   * @param {boolean} indentation_uses_spaces
   * @param {boolean} first_encaps_node if it is behind a variable, the first N spaces should not be removed
   */
  check_heredoc_indentation_level: function (
    text,
    indentation,
    indentation_uses_spaces,
    first_encaps_node
  ) {
    const textSize = text.length;
    let offset = 0;
    let leadingWhitespaceCharCount = 0;
    /*
     * @var inCoutingState {boolean} reset to true after a new line
     * @private
     */
    let inCoutingState = true;
    const chToCheck = indentation_uses_spaces ? " " : "\t";
    let inCheckState = false;
    if (!first_encaps_node) {
      // start from first \n
      offset = text.indexOf("\n");
      // if no \n, just return
      if (offset === -1) {
        return;
      }
      offset++;
    }
    while (offset < textSize) {
      if (inCoutingState) {
        if (text[offset] === chToCheck) {
          leadingWhitespaceCharCount++;
        } else {
          inCheckState = true;
        }
      } else {
        inCoutingState = false;
      }

      if (
        text[offset] !== "\n" &&
        inCheckState &&
        leadingWhitespaceCharCount < indentation
      ) {
        this.raiseError(
          `Invalid body indentation level (expecting an indentation at least ${indentation})`
        );
      } else {
        inCheckState = false;
      }

      if (text[offset] === "\n") {
        // Reset counting state
        inCoutingState = true;
        leadingWhitespaceCharCount = 0;
      }
      offset++;
    }
  },

  /*
   * Reads dereferencable scalar
   */
  read_dereferencable_scalar: function () {
    let result = null;

    switch (this.token) {
      case this.tok.T_CONSTANT_ENCAPSED_STRING:
        {
          let value = this.node("string");
          const text = this.text();
          let offset = 0;
          if (text[0] === "b" || text[0] === "B") {
            offset = 1;
          }
          const isDoubleQuote = text[offset] === '"';
          this.next();
          const textValue = this.resolve_special_chars(
            text.substring(offset + 1, text.length - 1),
            isDoubleQuote
          );
          value = value(
            isDoubleQuote,
            textValue,
            offset === 1, // unicode flag
            text
          );
          if (this.token === this.tok.T_DOUBLE_COLON) {
            // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1151
            result = this.read_static_getter(value);
          } else {
            // dirrect string
            result = value;
          }
        }
        break;
      case this.tok.T_ARRAY: // array parser
        result = this.read_array();
        break;
      case "[": // short array format
        result = this.read_array();
        break;
    }

    return result;
  },

  /*
   * ```ebnf
   *  scalar ::= T_MAGIC_CONST
   *       | T_LNUMBER | T_DNUMBER
   *       | T_START_HEREDOC T_ENCAPSED_AND_WHITESPACE? T_END_HEREDOC
   *       | '"' encaps_list '"'
   *       | T_START_HEREDOC encaps_list T_END_HEREDOC
   *       | namespace_name (T_DOUBLE_COLON T_STRING)?
   * ```
   */
  read_scalar: function () {
    if (this.is("T_MAGIC_CONST")) {
      return this.get_magic_constant();
    } else {
      let value, node;
      switch (this.token) {
        // NUMERIC
        case this.tok.T_LNUMBER: // long
        case this.tok.T_DNUMBER: {
          // double
          const result = this.node("number");
          value = this.text();
          this.next();
          return result(value, null);
        }
        case this.tok.T_START_HEREDOC:
          if (this.lexer.curCondition === "ST_NOWDOC") {
            const start = this.lexer.yylloc.first_offset;
            node = this.node("nowdoc");
            value = this.next().text();
            // strip the last line return char
            if (this.lexer.heredoc_label.indentation > 0) {
              value = value.substring(
                0,
                value.length - this.lexer.heredoc_label.indentation
              );
            }
            const lastCh = value[value.length - 1];
            if (lastCh === "\n") {
              if (value[value.length - 2] === "\r") {
                // windows style
                value = value.substring(0, value.length - 2);
              } else {
                // linux style
                value = value.substring(0, value.length - 1);
              }
            } else if (lastCh === "\r") {
              // mac style
              value = value.substring(0, value.length - 1);
            }
            this.expect(this.tok.T_ENCAPSED_AND_WHITESPACE) && this.next();
            this.expect(this.tok.T_END_HEREDOC) && this.next();
            const raw = this.lexer._input.substring(
              start,
              this.lexer.yylloc.first_offset
            );
            node = node(
              this.remove_heredoc_leading_whitespace_chars(
                value,
                this.lexer.heredoc_label.indentation,
                this.lexer.heredoc_label.indentation_uses_spaces,
                this.lexer.heredoc_label.first_encaps_node
              ),
              raw,
              this.lexer.heredoc_label.label
            );
            this.lexer.heredoc_label.finished = true;
            return node;
          } else {
            return this.read_encapsed_string(this.tok.T_END_HEREDOC);
          }

        case '"':
          return this.read_encapsed_string('"');

        case 'b"':
        case 'B"': {
          return this.read_encapsed_string('"', true);
        }

        // TEXTS
        case this.tok.T_CONSTANT_ENCAPSED_STRING:
        case this.tok.T_ARRAY: // array parser
        case "[": // short array format
          return this.read_dereferencable_scalar();
        default: {
          const err = this.error("SCALAR");
          // graceful mode : ignore token & return error node
          this.next();
          return err;
        }
      }
    }
  },
  /*
   * Handles the dereferencing
   */
  read_dereferencable: function (expr) {
    let result, offset;
    const node = this.node("offsetlookup");
    if (this.token === "[") {
      offset = this.next().read_expr();
      if (this.expect("]")) this.next();
      result = node(expr, offset);
    } else if (this.token === this.tok.T_DOLLAR_OPEN_CURLY_BRACES) {
      offset = this.read_encapsed_string_item(false);
      result = node(expr, offset);
    }
    return result;
  },
  /*
   * Reads and extracts an encapsed item
   * ```ebnf
   * encapsed_string_item ::= T_ENCAPSED_AND_WHITESPACE
   *  | T_DOLLAR_OPEN_CURLY_BRACES expr '}'
   *  | T_DOLLAR_OPEN_CURLY_BRACES T_STRING_VARNAME '}'
   *  | T_DOLLAR_OPEN_CURLY_BRACES T_STRING_VARNAME '[' expr ']' '}'
   *  | T_CURLY_OPEN variable '}'
   *  | variable
   *  | variable '[' expr ']'
   *  | variable T_OBJECT_OPERATOR T_STRING
   * ```
   * @return {String|Variable|Expr|Lookup}
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1219
   */
  read_encapsed_string_item: function (isDoubleQuote) {
    const encapsedPart = this.node("encapsedpart");
    let syntax = null;
    let curly = false;
    let result = this.node(),
      offset,
      node,
      name;

    // plain text
    // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1222
    if (this.token === this.tok.T_ENCAPSED_AND_WHITESPACE) {
      const text = this.text();
      this.next();

      // if this.lexer.heredoc_label.first_encaps_node -> remove first indents
      result = result(
        "string",
        false,
        this.version >= 703 && !this.lexer.heredoc_label.finished
          ? this.remove_heredoc_leading_whitespace_chars(
              this.resolve_special_chars(text, isDoubleQuote),
              this.lexer.heredoc_label.indentation,
              this.lexer.heredoc_label.indentation_uses_spaces,
              this.lexer.heredoc_label.first_encaps_node
            )
          : text,
        false,
        text
      );
    } else if (this.token === this.tok.T_DOLLAR_OPEN_CURLY_BRACES) {
      syntax = "simple";
      curly = true;
      // dynamic variable name
      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1239
      name = null;
      if (this.next().token === this.tok.T_STRING_VARNAME) {
        name = this.node("variable");
        const varName = this.text();
        this.next();
        // check if lookup an offset
        // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1243
        result.destroy();
        if (this.token === "[") {
          name = name(varName, false);
          node = this.node("offsetlookup");
          offset = this.next().read_expr();
          this.expect("]") && this.next();
          result = node(name, offset);
        } else {
          result = name(varName, false);
        }
      } else {
        result = result("variable", this.read_expr(), false);
      }
      this.expect("}") && this.next();
    } else if (this.token === this.tok.T_CURLY_OPEN) {
      // expression
      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1246
      syntax = "complex";
      result.destroy();
      result = this.next().read_variable(false, false);
      this.expect("}") && this.next();
    } else if (this.token === this.tok.T_VARIABLE) {
      syntax = "simple";
      // plain variable
      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1231
      result.destroy();
      result = this.read_simple_variable();

      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1233
      if (this.token === "[") {
        node = this.node("offsetlookup");
        offset = this.next().read_encaps_var_offset();
        this.expect("]") && this.next();
        result = node(result, offset);
      }

      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L1236
      if (this.token === this.tok.T_OBJECT_OPERATOR) {
        node = this.node("propertylookup");
        this.next().expect(this.tok.T_STRING);
        const what = this.node("identifier");
        name = this.text();
        this.next();
        result = node(result, what(name));
      }

      // error / fallback
    } else {
      this.expect(this.tok.T_ENCAPSED_AND_WHITESPACE);
      const value = this.text();
      this.next();
      // consider it as string
      result.destroy();
      result = result("string", false, value, false, value);
    }

    // reset first_encaps_node to false after access any node
    this.lexer.heredoc_label.first_encaps_node = false;
    return encapsedPart(result, syntax, curly);
  },
  /*
   * Reads an encapsed string
   */
  read_encapsed_string: function (expect, isBinary = false) {
    const labelStart = this.lexer.yylloc.first_offset;
    let node = this.node("encapsed");
    this.next();
    const start = this.lexer.yylloc.prev_offset - (isBinary ? 1 : 0);
    const value = [];
    let type = null;

    if (expect === "`") {
      type = this.ast.encapsed.TYPE_SHELL;
    } else if (expect === '"') {
      type = this.ast.encapsed.TYPE_STRING;
    } else {
      type = this.ast.encapsed.TYPE_HEREDOC;
    }

    // reading encapsed parts
    while (this.token !== expect && this.token !== this.EOF) {
      value.push(this.read_encapsed_string_item(true));
    }
    if (
      value.length > 0 &&
      value[value.length - 1].kind === "encapsedpart" &&
      value[value.length - 1].expression.kind === "string"
    ) {
      const node = value[value.length - 1].expression;
      const lastCh = node.value[node.value.length - 1];
      if (lastCh === "\n") {
        if (node.value[node.value.length - 2] === "\r") {
          // windows style
          node.value = node.value.substring(0, node.value.length - 2);
        } else {
          // linux style
          node.value = node.value.substring(0, node.value.length - 1);
        }
      } else if (lastCh === "\r") {
        // mac style
        node.value = node.value.substring(0, node.value.length - 1);
      }
    }
    this.expect(expect) && this.next();
    const raw = this.lexer._input.substring(
      type === "heredoc" ? labelStart : start - 1,
      this.lexer.yylloc.first_offset
    );
    node = node(value, raw, type);

    if (expect === this.tok.T_END_HEREDOC) {
      node.label = this.lexer.heredoc_label.label;
      this.lexer.heredoc_label.finished = true;
    }
    return node;
  },
  /*
   * Constant token
   */
  get_magic_constant: function () {
    const result = this.node("magic");
    const name = this.text();
    this.next();
    return result(name.toUpperCase(), name);
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var statement$1 = {
  /*
   * reading a list of top statements (helper for top_statement*)
   * ```ebnf
   *  top_statements ::= top_statement*
   * ```
   */
  read_top_statements: function () {
    let result = [];
    while (this.token !== this.EOF && this.token !== "}") {
      const statement = this.read_top_statement();
      if (statement) {
        if (Array.isArray(statement)) {
          result = result.concat(statement);
        } else {
          result.push(statement);
        }
      }
    }
    return result;
  },
  /*
   * reading a top statement
   * ```ebnf
   *  top_statement ::=
   *       namespace | function | class
   *       | interface | trait
   *       | use_statements | const_list
   *       | statement
   * ```
   */
  read_top_statement: function () {
    let attrs = [];
    if (this.token === this.tok.T_ATTRIBUTE) {
      attrs = this.read_attr_list();
    }
    switch (this.token) {
      case this.tok.T_FUNCTION:
        return this.read_function(false, false, attrs);
      // optional flags
      case this.tok.T_ABSTRACT:
      case this.tok.T_FINAL:
      case this.tok.T_READ_ONLY:
      case this.tok.T_CLASS:
        return this.read_class_declaration_statement(attrs);
      case this.tok.T_INTERFACE:
        return this.read_interface_declaration_statement(attrs);
      case this.tok.T_TRAIT:
        return this.read_trait_declaration_statement();
      case this.tok.T_ENUM:
        return this.read_enum_declaration_statement(attrs);
      case this.tok.T_USE:
        return this.read_use_statement();
      case this.tok.T_CONST: {
        const result = this.node("constantstatement");
        const items = this.next().read_const_list();
        this.expectEndOfStatement();
        return result(null, items);
      }
      case this.tok.T_NAMESPACE:
        return this.read_namespace();
      case this.tok.T_HALT_COMPILER: {
        const result = this.node("halt");
        if (this.next().expect("(")) this.next();
        if (this.expect(")")) this.next();
        this.expect(";");
        this.lexer.done = true;
        return result(this.lexer._input.substring(this.lexer.offset));
      }
      default:
        return this.read_statement();
    }
  },
  /*
   * reads a list of simple inner statements (helper for inner_statement*)
   * ```ebnf
   *  inner_statements ::= inner_statement*
   * ```
   */
  read_inner_statements: function () {
    let result = [];
    while (this.token != this.EOF && this.token !== "}") {
      const statement = this.read_inner_statement();
      if (statement) {
        if (Array.isArray(statement)) {
          result = result.concat(statement);
        } else {
          result.push(statement);
        }
      }
    }
    return result;
  },
  /*
   * Reads a list of constants declaration
   * ```ebnf
   *   const_list ::= T_CONST T_STRING '=' expr (',' T_STRING '=' expr)* ';'
   * ```
   */
  read_const_list: function () {
    return this.read_list(
      function () {
        this.expect(this.tok.T_STRING);
        const result = this.node("constant");
        let constName = this.node("identifier");
        const name = this.text();
        this.next();
        constName = constName(name);
        if (this.expect("=")) {
          return result(constName, this.next().read_expr());
        } else {
          // fallback
          return result(constName, null);
        }
      },
      ",",
      false
    );
  },
  /*
   * Reads a list of constants declaration
   * ```ebnf
   *   declare_list ::= IDENTIFIER '=' expr (',' IDENTIFIER '=' expr)*
   * ```
   * @retrurn {Array}
   */
  read_declare_list: function () {
    const result = [];
    while (this.token != this.EOF && this.token !== ")") {
      this.expect(this.tok.T_STRING);
      const directive = this.node("declaredirective");
      let key = this.node("identifier");
      const name = this.text();
      this.next();
      key = key(name);
      let value = null;
      if (this.expect("=")) {
        value = this.next().read_expr();
      }
      result.push(directive(key, value));
      if (this.token !== ",") break;
      this.next();
    }
    return result;
  },
  /*
   * reads a simple inner statement
   * ```ebnf
   *  inner_statement ::= '{' inner_statements '}' | token
   * ```
   */
  read_inner_statement: function () {
    let attrs = [];
    if (this.token === this.tok.T_ATTRIBUTE) {
      attrs = this.read_attr_list();
    }
    switch (this.token) {
      case this.tok.T_FUNCTION: {
        const result = this.read_function(false, false);
        result.attrGroups = attrs;
        return result;
      }
      // optional flags
      case this.tok.T_ABSTRACT:
      case this.tok.T_FINAL:
      case this.tok.T_CLASS:
        return this.read_class_declaration_statement();
      case this.tok.T_INTERFACE:
        return this.read_interface_declaration_statement();
      case this.tok.T_TRAIT:
        return this.read_trait_declaration_statement();
      case this.tok.T_ENUM:
        return this.read_enum_declaration_statement();
      case this.tok.T_HALT_COMPILER: {
        this.raiseError(
          "__HALT_COMPILER() can only be used from the outermost scope"
        );
        // fallback : returns a node but does not stop the parsing
        let node = this.node("halt");
        this.next().expect("(") && this.next();
        this.expect(")") && this.next();
        node = node(this.lexer._input.substring(this.lexer.offset));
        this.expect(";") && this.next();
        return node;
      }
      default:
        return this.read_statement();
    }
  },
  /*
   * Reads statements
   */
  read_statement: function () {
    switch (this.token) {
      case "{":
        return this.read_code_block(false);

      case this.tok.T_IF:
        return this.read_if();

      case this.tok.T_SWITCH:
        return this.read_switch();

      case this.tok.T_FOR:
        return this.read_for();

      case this.tok.T_FOREACH:
        return this.read_foreach();

      case this.tok.T_WHILE:
        return this.read_while();

      case this.tok.T_DO:
        return this.read_do();

      case this.tok.T_COMMENT:
        return this.read_comment();

      case this.tok.T_DOC_COMMENT:
        return this.read_doc_comment();

      case this.tok.T_RETURN: {
        const result = this.node("return");
        this.next();
        const expr = this.read_optional_expr(";");
        this.expectEndOfStatement();
        return result(expr);
      }

      // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L429
      case this.tok.T_BREAK:
      case this.tok.T_CONTINUE: {
        const result = this.node(
          this.token === this.tok.T_CONTINUE ? "continue" : "break"
        );
        this.next();
        const level = this.read_optional_expr(";");
        this.expectEndOfStatement();
        return result(level);
      }

      case this.tok.T_GLOBAL: {
        const result = this.node("global");
        const items = this.next().read_list(this.read_simple_variable, ",");
        this.expectEndOfStatement();
        return result(items);
      }

      case this.tok.T_STATIC: {
        const current = [this.token, this.lexer.getState()];
        const result = this.node();
        if (this.next().token === this.tok.T_DOUBLE_COLON) {
          // static keyword for a class
          this.lexer.tokens.push(current);
          const expr = this.next().read_expr();
          this.expectEndOfStatement(expr);
          return result("expressionstatement", expr);
        }
        if (this.token === this.tok.T_FUNCTION) {
          return this.read_function(true, [0, 1, 0]);
        }
        const items = this.read_variable_declarations();
        this.expectEndOfStatement();
        return result("static", items);
      }

      case this.tok.T_ECHO: {
        const result = this.node("echo");
        const text = this.text();
        const shortForm = text === "<?=" || text === "<%=";
        const expressions = this.next().read_function_list(this.read_expr, ",");
        this.expectEndOfStatement();
        return result(expressions, shortForm);
      }

      case this.tok.T_INLINE_HTML: {
        const value = this.text();
        let prevChar =
          this.lexer.yylloc.first_offset > 0
            ? this.lexer._input[this.lexer.yylloc.first_offset - 1]
            : null;
        const fixFirstLine = prevChar === "\r" || prevChar === "\n";
        // revert back the first stripped line
        if (fixFirstLine) {
          if (
            prevChar === "\n" &&
            this.lexer.yylloc.first_offset > 1 &&
            this.lexer._input[this.lexer.yylloc.first_offset - 2] === "\r"
          ) {
            prevChar = "\r\n";
          }
        }
        const result = this.node("inline");
        this.next();
        return result(value, fixFirstLine ? prevChar + value : value);
      }

      case this.tok.T_UNSET: {
        const result = this.node("unset");
        this.next().expect("(") && this.next();
        const variables = this.read_function_list(this.read_variable, ",");
        this.expect(")") && this.next();
        this.expect(";") && this.next();
        return result(variables);
      }

      case this.tok.T_DECLARE: {
        const result = this.node("declare");
        const body = [];
        let mode;
        this.next().expect("(") && this.next();
        const directives = this.read_declare_list();
        this.expect(")") && this.next();
        if (this.token === ":") {
          this.next();
          while (
            this.token != this.EOF &&
            this.token !== this.tok.T_ENDDECLARE
          ) {
            // @todo : check declare_statement from php / not valid
            body.push(this.read_top_statement());
          }
          if (
            body.length === 0 &&
            this.extractDoc &&
            this._docs.length > this._docIndex
          ) {
            body.push(this.node("noop")());
          }
          this.expect(this.tok.T_ENDDECLARE) && this.next();
          this.expectEndOfStatement();
          mode = this.ast.declare.MODE_SHORT;
        } else if (this.token === "{") {
          this.next();
          while (this.token != this.EOF && this.token !== "}") {
            // @todo : check declare_statement from php / not valid
            body.push(this.read_top_statement());
          }
          if (
            body.length === 0 &&
            this.extractDoc &&
            this._docs.length > this._docIndex
          ) {
            body.push(this.node("noop")());
          }
          this.expect("}") && this.next();
          mode = this.ast.declare.MODE_BLOCK;
        } else {
          this.expect(";") && this.next();
          mode = this.ast.declare.MODE_NONE;
        }
        return result(directives, body, mode);
      }

      case this.tok.T_TRY:
        return this.read_try();

      case this.tok.T_THROW: {
        const result = this.node("throw");
        const expr = this.next().read_expr();
        this.expectEndOfStatement();
        return result(expr);
      }

      // ignore this (extra ponctuation)
      case ";": {
        this.next();
        return null;
      }

      case this.tok.T_STRING: {
        const result = this.node();
        const current = [this.token, this.lexer.getState()];
        const labelNameText = this.text();
        let labelName = this.node("identifier");
        // AST : https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L457
        if (this.next().token === ":") {
          labelName = labelName(labelNameText);
          this.next();
          return result("label", labelName);
        } else {
          labelName.destroy();
        }

        // default fallback expr / T_STRING '::' (etc...)
        result.destroy();
        this.lexer.tokens.push(current);
        const statement = this.node("expressionstatement");
        const expr = this.next().read_expr();
        this.expectEndOfStatement(expr);
        return statement(expr);
      }

      case this.tok.T_GOTO: {
        const result = this.node("goto");
        let labelName = null;
        if (this.next().expect(this.tok.T_STRING)) {
          labelName = this.node("identifier");
          const name = this.text();
          this.next();
          labelName = labelName(name);
          this.expectEndOfStatement();
        }
        return result(labelName);
      }

      default: {
        // default fallback expr
        const statement = this.node("expressionstatement");
        const expr = this.read_expr();
        this.expectEndOfStatement(expr);
        return statement(expr);
      }
    }
  },
  /*
   * ```ebnf
   *  code_block ::= '{' (inner_statements | top_statements) '}'
   * ```
   */
  read_code_block: function (top) {
    const result = this.node("block");
    this.expect("{") && this.next();
    const body = top
      ? this.read_top_statements()
      : this.read_inner_statements();
    if (
      body.length === 0 &&
      this.extractDoc &&
      this._docs.length > this._docIndex
    ) {
      body.push(this.node("noop")());
    }
    this.expect("}") && this.next();
    return result(null, body);
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var _switch$1 = {
  /*
   * Reads a switch statement
   * ```ebnf
   *  switch ::= T_SWITCH '(' expr ')' switch_case_list
   * ```
   * @return {Switch}
   * @see http://php.net/manual/en/control-structures.switch.php
   */
  read_switch: function () {
    const result = this.node("switch");
    this.expect(this.tok.T_SWITCH) && this.next();
    this.expect("(") && this.next();
    const test = this.read_expr();
    this.expect(")") && this.next();
    const shortForm = this.token === ":";
    const body = this.read_switch_case_list();
    return result(test, body, shortForm);
  },
  /*
   * ```ebnf
   *  switch_case_list ::= '{' ';'? case_list* '}' | ':' ';'? case_list* T_ENDSWITCH ';'
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L566
   */
  read_switch_case_list: function () {
    // DETECT SWITCH MODE
    let expect = null;
    const result = this.node("block");
    const items = [];
    if (this.token === "{") {
      expect = "}";
    } else if (this.token === ":") {
      expect = this.tok.T_ENDSWITCH;
    } else {
      this.expect(["{", ":"]);
    }
    this.next();
    // OPTIONNAL ';'
    // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L570
    if (this.token === ";") {
      this.next();
    }
    // EXTRACTING CASES
    while (this.token !== this.EOF && this.token !== expect) {
      items.push(this.read_case_list(expect));
    }
    if (
      items.length === 0 &&
      this.extractDoc &&
      this._docs.length > this._docIndex
    ) {
      items.push(this.node("noop")());
    }
    // CHECK END TOKEN
    this.expect(expect) && this.next();
    if (expect === this.tok.T_ENDSWITCH) {
      this.expectEndOfStatement();
    }
    return result(null, items);
  },
  /*
   * ```ebnf
   *   case_list ::= ((T_CASE expr) | T_DEFAULT) (':' | ';') inner_statement*
   * ```
   */
  read_case_list: function (stopToken) {
    const result = this.node("case");
    let test = null;
    if (this.token === this.tok.T_CASE) {
      test = this.next().read_expr();
    } else if (this.token === this.tok.T_DEFAULT) {
      // the default entry - no condition
      this.next();
    } else {
      this.expect([this.tok.T_CASE, this.tok.T_DEFAULT]);
    }
    // case_separator
    this.expect([":", ";"]) && this.next();
    const body = this.node("block");
    const items = [];
    while (
      this.token !== this.EOF &&
      this.token !== stopToken &&
      this.token !== this.tok.T_CASE &&
      this.token !== this.tok.T_DEFAULT
    ) {
      items.push(this.read_inner_statement());
    }
    return result(test, body(null, items));
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var _try$1 = {
  /*
   * ```ebnf
   *  try ::= T_TRY '{' inner_statement* '}'
   *          (
   *              T_CATCH '(' namespace_name (variable)? ')' '{'  inner_statement* '}'
   *          )*
   *          (T_FINALLY '{' inner_statement* '}')?
   * ```
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L448
   * @return {Try}
   */
  read_try: function () {
    this.expect(this.tok.T_TRY);
    const result = this.node("try");
    let always = null;
    const catches = [];
    const body = this.next().read_statement();
    // https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L455
    while (this.token === this.tok.T_CATCH) {
      const item = this.node("catch");
      this.next().expect("(") && this.next();
      const what = this.read_list(this.read_namespace_name, "|", false);
      let variable = null;
      if (this.version < 800 || this.token === this.tok.T_VARIABLE) {
        variable = this.read_variable(true, false);
      }
      this.expect(")");
      catches.push(item(this.next().read_statement(), what, variable));
    }
    if (this.token === this.tok.T_FINALLY) {
      always = this.next().read_statement();
    }
    return result(body, catches, always);
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var utils = {
  /*
   * Reads a short form of tokens
   * @param {Number} token - The ending token
   * @return {Block}
   */
  read_short_form: function (token) {
    const body = this.node("block");
    const items = [];
    /* istanbul ignore next */
    if (this.expect(":")) this.next();
    while (this.token != this.EOF && this.token !== token) {
      items.push(this.read_inner_statement());
    }
    if (
      items.length === 0 &&
      this.extractDoc &&
      this._docs.length > this._docIndex
    ) {
      items.push(this.node("noop")());
    }
    /* istanbul ignore next */
    if (this.expect(token)) this.next();
    this.expectEndOfStatement();
    return body(null, items);
  },

  /*
   * https://wiki.php.net/rfc/trailing-comma-function-calls
   * @param {*} item
   * @param {*} separator
   */
  read_function_list: function (item, separator) {
    const result = [];
    do {
      if (this.token == separator && this.version >= 703 && result.length > 0) {
        result.push(this.node("noop")());
        break;
      }
      result.push(item.apply(this, []));
      if (this.token != separator) {
        break;
      }
      if (this.next().token == ")" && this.version >= 703) {
        break;
      }
    } while (this.token != this.EOF);
    return result;
  },

  /*
   * Helper : reads a list of tokens / sample : T_STRING ',' T_STRING ...
   * ```ebnf
   * list ::= separator? ( item separator )* item
   * ```
   */
  read_list: function (item, separator, preserveFirstSeparator) {
    const result = [];

    if (this.token == separator) {
      if (preserveFirstSeparator) {
        result.push(typeof item === "function" ? this.node("noop")() : null);
      }
      this.next();
    }

    if (typeof item === "function") {
      do {
        const itemResult = item.apply(this, []);
        if (itemResult) {
          result.push(itemResult);
        }
        if (this.token != separator) {
          break;
        }
      } while (this.next().token != this.EOF);
    } else {
      if (this.expect(item)) {
        result.push(this.text());
      } else {
        return [];
      }
      while (this.next().token != this.EOF) {
        if (this.token != separator) break;
        // trim current separator & check item
        if (this.next().token != item) break;
        result.push(this.text());
      }
    }
    return result;
  },

  /*
   * Reads a list of names separated by a comma
   *
   * ```ebnf
   * name_list ::= namespace (',' namespace)*
   * ```
   *
   * Sample code :
   * ```php
   * <?php class foo extends bar, baz { }
   * ```
   *
   * @see https://github.com/php/php-src/blob/master/Zend/zend_language_parser.y#L726
   * @return {Reference[]}
   */
  read_name_list: function () {
    return this.read_list(this.read_namespace_name, ",", false);
  },

  /*
   * Reads the byref token and assign it to the specified node
   * @param {*} cb
   */
  read_byref: function (cb) {
    let byref = this.node("byref");
    this.next();
    byref = byref(null);
    const result = cb();
    if (result) {
      this.ast.swapLocations(result, byref, result, this);
      result.byref = true;
    }
    return result;
  },

  /*
   * Reads a list of variables declarations
   *
   * ```ebnf
   * variable_declaration ::= T_VARIABLE ('=' expr)?*
   * variable_declarations ::= variable_declaration (',' variable_declaration)*
   * ```
   *
   * Sample code :
   * ```php
   * <?php static $a = 'hello', $b = 'world';
   * ```
   * @return {StaticVariable[]} Returns an array composed by a list of variables, or
   * assign values
   */
  read_variable_declarations: function () {
    return this.read_list(function () {
      const node = this.node("staticvariable");
      let variable = this.node("variable");
      // plain variable name
      /* istanbul ignore else */
      if (this.expect(this.tok.T_VARIABLE)) {
        const name = this.text().substring(1);
        this.next();
        variable = variable(name, false);
      } else {
        variable = variable("#ERR", false);
      }
      if (this.token === "=") {
        return node(variable, this.next().read_expr());
      } else {
        return variable;
      }
    }, ",");
  },

  /*
   * Reads class extends
   */
  read_extends_from: function () {
    if (this.token === this.tok.T_EXTENDS) {
      return this.next().read_namespace_name();
    }

    return null;
  },

  /*
   * Reads interface extends list
   */
  read_interface_extends_list: function () {
    if (this.token === this.tok.T_EXTENDS) {
      return this.next().read_name_list();
    }

    return null;
  },

  /*
   * Reads implements list
   */
  read_implements_list: function () {
    if (this.token === this.tok.T_IMPLEMENTS) {
      return this.next().read_name_list();
    }

    return null;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

var variable$1 = {
  /*
   * Reads a variable
   *
   * ```ebnf
   *   variable ::= &? ...complex @todo
   * ```
   *
   * Some samples of parsed code :
   * ```php
   *  &$var                      // simple var
   *  $var                      // simple var
   *  classname::CONST_NAME     // dynamic class name with const retrieval
   *  foo()                     // function call
   *  $var->func()->property    // chained calls
   * ```
   */
  read_variable: function (read_only, encapsed) {
    let result;
    // check the byref flag
    if (this.token === "&") {
      return this.read_byref(
        this.read_variable.bind(this, read_only, encapsed)
      );
    }

    // reads the entry point
    if (this.is([this.tok.T_VARIABLE, "$"])) {
      result = this.read_reference_variable(encapsed);
    } else if (
      this.is([
        this.tok.T_NS_SEPARATOR,
        this.tok.T_STRING,
        this.tok.T_NAME_RELATIVE,
        this.tok.T_NAME_QUALIFIED,
        this.tok.T_NAME_FULLY_QUALIFIED,
        this.tok.T_NAMESPACE,
      ])
    ) {
      result = this.node();
      const name = this.read_namespace_name();
      if (
        this.token != this.tok.T_DOUBLE_COLON &&
        this.token != "(" &&
        ["parentreference", "selfreference"].indexOf(name.kind) === -1
      ) {
        // @see parser.js line 130 : resolves a conflict with scalar
        const literal = name.name.toLowerCase();
        if (literal === "true") {
          result = name.destroy(result("boolean", true, name.name));
        } else if (literal === "false") {
          result = name.destroy(result("boolean", false, name.name));
        } else if (literal === "null") {
          result = name.destroy(result("nullkeyword", name.name));
        } else {
          result.destroy(name);
          result = name;
        }
      } else {
        // @fixme possible #193 bug
        result.destroy(name);
        result = name;
      }
    } else if (this.token === this.tok.T_STATIC) {
      result = this.node("staticreference");
      const raw = this.text();
      this.next();
      result = result(raw);
    } else {
      this.expect("VARIABLE");
    }

    // static mode
    if (this.token === this.tok.T_DOUBLE_COLON) {
      result = this.read_static_getter(result, encapsed);
    }

    return this.recursive_variable_chain_scan(result, read_only, encapsed);
  },

  // resolves a static call
  read_static_getter: function (what, encapsed) {
    const result = this.node("staticlookup");
    let offset, name;
    if (this.next().is([this.tok.T_VARIABLE, "$"])) {
      offset = this.read_reference_variable(encapsed);
    } else if (
      this.token === this.tok.T_STRING ||
      this.token === this.tok.T_CLASS ||
      (this.version >= 700 && this.is("IDENTIFIER"))
    ) {
      offset = this.node("identifier");
      name = this.text();
      this.next();
      offset = offset(name);
    } else if (this.token === "{") {
      offset = this.node("literal");
      name = this.next().read_expr();
      this.expect("}") && this.next();
      offset = offset("literal", name, null);
      this.expect("(");
    } else {
      this.error([this.tok.T_VARIABLE, this.tok.T_STRING]);
      // graceful mode : set getter as error node and continue
      offset = this.node("identifier");
      name = this.text();
      this.next();
      offset = offset(name);
    }
    return result(what, offset);
  },

  read_what: function (is_static_lookup = false) {
    let what = null;
    let name = null;
    switch (this.next().token) {
      case this.tok.T_STRING:
        what = this.node("identifier");
        name = this.text();
        this.next();
        what = what(name);

        if (is_static_lookup && this.token === this.tok.T_OBJECT_OPERATOR) {
          this.error();
        }
        break;
      case this.tok.T_VARIABLE:
        what = this.node("variable");
        name = this.text().substring(1);
        this.next();
        what = what(name, false);
        break;
      case "$":
        what = this.node();
        this.next().expect(["$", "{", this.tok.T_VARIABLE]);
        if (this.token === "{") {
          // $obj->${$varname}
          name = this.next().read_expr();
          this.expect("}") && this.next();
          what = what("variable", name, true);
        } else {
          // $obj->$$varname
          name = this.read_expr();
          what = what("variable", name, false);
        }
        break;
      case "{":
        what = this.node("encapsedpart");
        name = this.next().read_expr();
        this.expect("}") && this.next();
        what = what(name, "complex", false);
        break;
      default:
        this.error([this.tok.T_STRING, this.tok.T_VARIABLE, "$", "{"]);
        // graceful mode : set what as error mode & continue
        what = this.node("identifier");
        name = this.text();
        this.next();
        what = what(name);
        break;
    }

    return what;
  },

  recursive_variable_chain_scan: function (result, read_only, encapsed) {
    let node, offset;
    recursive_scan_loop: while (this.token != this.EOF) {
      switch (this.token) {
        case "(":
          if (read_only) {
            // @fixme : add more informations & test
            return result;
          } else {
            result = this.node("call")(result, this.read_argument_list());
          }
          break;
        case "[":
        case "{": {
          const backet = this.token;
          const isSquareBracket = backet === "[";
          node = this.node("offsetlookup");
          this.next();
          offset = false;
          if (encapsed) {
            offset = this.read_encaps_var_offset();
            this.expect(isSquareBracket ? "]" : "}") && this.next();
          } else {
            const isCallableVariable = isSquareBracket
              ? this.token !== "]"
              : this.token !== "}";
            // callable_variable : https://github.com/php/php-src/blob/493524454d66adde84e00d249d607ecd540de99f/Zend/zend_language_parser.y#L1122
            if (isCallableVariable) {
              offset = this.read_expr();
              this.expect(isSquareBracket ? "]" : "}") && this.next();
            } else {
              this.next();
            }
          }
          result = node(result, offset);
          break;
        }
        case this.tok.T_DOUBLE_COLON:
          // @see https://github.com/glayzzle/php-parser/issues/107#issuecomment-354104574
          if (
            result.kind === "staticlookup" &&
            result.offset.kind === "identifier"
          ) {
            this.error();
          }

          node = this.node("staticlookup");
          result = node(result, this.read_what(true));

          // fix 185
          // static lookup dereferencables are limited to staticlookup over functions
          /*if (dereferencable && this.token !== "(") {
            this.error("(");
          }*/
          break;
        case this.tok.T_OBJECT_OPERATOR: {
          node = this.node("propertylookup");
          result = node(result, this.read_what());
          break;
        }
        case this.tok.T_NULLSAFE_OBJECT_OPERATOR: {
          node = this.node("nullsafepropertylookup");
          result = node(result, this.read_what());
          break;
        }
        default:
          break recursive_scan_loop;
      }
    }
    return result;
  },
  /*
   * https://github.com/php/php-src/blob/493524454d66adde84e00d249d607ecd540de99f/Zend/zend_language_parser.y#L1231
   */
  read_encaps_var_offset: function () {
    let offset = this.node();
    if (this.token === this.tok.T_STRING) {
      const text = this.text();
      this.next();
      offset = offset("identifier", text);
    } else if (this.token === this.tok.T_NUM_STRING) {
      const num = this.text();
      this.next();
      offset = offset("number", num, null);
    } else if (this.token === "-") {
      this.next();
      const num = -1 * this.text();
      this.expect(this.tok.T_NUM_STRING) && this.next();
      offset = offset("number", num, null);
    } else if (this.token === this.tok.T_VARIABLE) {
      const name = this.text().substring(1);
      this.next();
      offset = offset("variable", name, false);
    } else {
      this.expect([
        this.tok.T_STRING,
        this.tok.T_NUM_STRING,
        "-",
        this.tok.T_VARIABLE,
      ]);
      // fallback : consider as identifier
      const text = this.text();
      this.next();
      offset = offset("identifier", text);
    }
    return offset;
  },
  /*
   * ```ebnf
   *  reference_variable ::=  simple_variable ('[' OFFSET ']')* | '{' EXPR '}'
   * ```
   * <code>
   *  $foo[123];      // foo is an array ==> gets its entry
   *  $foo{1};        // foo is a string ==> get the 2nd char offset
   *  ${'foo'}[123];  // get the dynamic var $foo
   *  $foo[123]{1};   // gets the 2nd char from the 123 array entry
   * </code>
   */
  read_reference_variable: function (encapsed) {
    let result = this.read_simple_variable();
    let offset;
    while (this.token != this.EOF) {
      const node = this.node();
      if (this.token == "{" && !encapsed) {
        // @fixme check coverage, not sure thats working
        offset = this.next().read_expr();
        this.expect("}") && this.next();
        result = node("offsetlookup", result, offset);
      } else {
        node.destroy();
        break;
      }
    }
    return result;
  },
  /*
   * ```ebnf
   *  simple_variable ::= T_VARIABLE | '$' '{' expr '}' | '$' simple_variable
   * ```
   */
  read_simple_variable: function () {
    let result = this.node("variable");
    let name;
    if (
      this.expect([this.tok.T_VARIABLE, "$"]) &&
      this.token === this.tok.T_VARIABLE
    ) {
      // plain variable name
      name = this.text().substring(1);
      this.next();
      result = result(name, false);
    } else {
      if (this.token === "$") this.next();
      // dynamic variable name
      switch (this.token) {
        case "{": {
          const expr = this.next().read_expr();
          this.expect("}") && this.next();
          result = result(expr, true);
          break;
        }
        case "$": // $$$var
          result = result(this.read_simple_variable(), false);
          break;
        case this.tok.T_VARIABLE: {
          // $$var
          name = this.text().substring(1);
          const node = this.node("variable");
          this.next();
          result = result(node(name, false), false);
          break;
        }
        default:
          this.error(["{", "$", this.tok.T_VARIABLE]);
          // graceful mode
          name = this.text();
          this.next();
          result = result(name, false);
      }
    }
    return result;
  },
};

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Position$1 = position;

/**
 * @private
 */
function isNumber(n) {
  return n != "." && n != "," && !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * The PHP Parser class that build the AST tree from the lexer
 *
 * @constructor Parser
 * @memberOf module:php-parser
 * @tutorial Parser
 * @property {Lexer} lexer - current lexer instance
 * @property {AST} ast - the AST factory instance
 * @property {number|string} token - current token
 * @property {boolean} extractDoc - should extract documentation as AST node
 * @property {boolean} extractTokens - should extract each token
 * @property {boolean} suppressErrors - should ignore parsing errors and continue
 * @property {boolean} debug - should output debug informations
 */
const Parser = function (lexer, ast) {
  this.lexer = lexer;
  this.ast = ast;
  this.tok = lexer.tok;
  this.EOF = lexer.EOF;
  this.token = null;
  this.prev = null;
  this.debug = false;
  this.version = 801;
  this.extractDoc = false;
  this.extractTokens = false;
  this.suppressErrors = false;
  const mapIt = function (item) {
    return [item, null];
  };
  this.entries = {
    // reserved_non_modifiers
    IDENTIFIER: new Map(
      [
        this.tok.T_ABSTRACT,
        this.tok.T_ARRAY,
        this.tok.T_AS,
        this.tok.T_BREAK,
        this.tok.T_CALLABLE,
        this.tok.T_CASE,
        this.tok.T_CATCH,
        this.tok.T_CLASS,
        this.tok.T_CLASS_C,
        this.tok.T_CLONE,
        this.tok.T_CONST,
        this.tok.T_CONTINUE,
        this.tok.T_DECLARE,
        this.tok.T_DEFAULT,
        this.tok.T_DIR,
        this.tok.T_DO,
        this.tok.T_ECHO,
        this.tok.T_ELSE,
        this.tok.T_ELSEIF,
        this.tok.T_EMPTY,
        this.tok.T_ENDDECLARE,
        this.tok.T_ENDFOR,
        this.tok.T_ENDFOREACH,
        this.tok.T_ENDIF,
        this.tok.T_ENDSWITCH,
        this.tok.T_ENDWHILE,
        this.tok.T_ENUM,
        this.tok.T_EVAL,
        this.tok.T_EXIT,
        this.tok.T_EXTENDS,
        this.tok.T_FILE,
        this.tok.T_FINAL,
        this.tok.T_FINALLY,
        this.tok.T_FN,
        this.tok.T_FOR,
        this.tok.T_FOREACH,
        this.tok.T_FUNC_C,
        this.tok.T_FUNCTION,
        this.tok.T_GLOBAL,
        this.tok.T_GOTO,
        this.tok.T_IF,
        this.tok.T_IMPLEMENTS,
        this.tok.T_INCLUDE,
        this.tok.T_INCLUDE_ONCE,
        this.tok.T_INSTANCEOF,
        this.tok.T_INSTEADOF,
        this.tok.T_INTERFACE,
        this.tok.T_ISSET,
        this.tok.T_LINE,
        this.tok.T_LIST,
        this.tok.T_LOGICAL_AND,
        this.tok.T_LOGICAL_OR,
        this.tok.T_LOGICAL_XOR,
        this.tok.T_MATCH,
        this.tok.T_METHOD_C,
        this.tok.T_NAMESPACE,
        this.tok.T_NEW,
        this.tok.T_NS_C,
        this.tok.T_PRINT,
        this.tok.T_PRIVATE,
        this.tok.T_PROTECTED,
        this.tok.T_PUBLIC,
        this.tok.T_READ_ONLY,
        this.tok.T_REQUIRE,
        this.tok.T_REQUIRE_ONCE,
        this.tok.T_RETURN,
        this.tok.T_STATIC,
        this.tok.T_SWITCH,
        this.tok.T_THROW,
        this.tok.T_TRAIT,
        this.tok.T_TRY,
        this.tok.T_UNSET,
        this.tok.T_USE,
        this.tok.T_VAR,
        this.tok.T_WHILE,
        this.tok.T_YIELD,
      ].map(mapIt)
    ),
    VARIABLE: new Map(
      [
        this.tok.T_VARIABLE,
        "$",
        "&",
        this.tok.T_STRING,
        this.tok.T_NAME_RELATIVE,
        this.tok.T_NAME_QUALIFIED,
        this.tok.T_NAME_FULLY_QUALIFIED,
        this.tok.T_NAMESPACE,
        this.tok.T_STATIC,
      ].map(mapIt)
    ),
    SCALAR: new Map(
      [
        this.tok.T_CONSTANT_ENCAPSED_STRING,
        this.tok.T_START_HEREDOC,
        this.tok.T_LNUMBER,
        this.tok.T_DNUMBER,
        this.tok.T_ARRAY,
        "[",
        this.tok.T_CLASS_C,
        this.tok.T_TRAIT_C,
        this.tok.T_FUNC_C,
        this.tok.T_METHOD_C,
        this.tok.T_LINE,
        this.tok.T_FILE,
        this.tok.T_DIR,
        this.tok.T_NS_C,
        '"',
        'b"',
        'B"',
        "-",
        this.tok.T_NS_SEPARATOR,
      ].map(mapIt)
    ),
    T_MAGIC_CONST: new Map(
      [
        this.tok.T_CLASS_C,
        this.tok.T_TRAIT_C,
        this.tok.T_FUNC_C,
        this.tok.T_METHOD_C,
        this.tok.T_LINE,
        this.tok.T_FILE,
        this.tok.T_DIR,
        this.tok.T_NS_C,
      ].map(mapIt)
    ),
    T_MEMBER_FLAGS: new Map(
      [
        this.tok.T_PUBLIC,
        this.tok.T_PRIVATE,
        this.tok.T_PROTECTED,
        this.tok.T_STATIC,
        this.tok.T_ABSTRACT,
        this.tok.T_FINAL,
      ].map(mapIt)
    ),
    EOS: new Map([";", this.EOF, this.tok.T_INLINE_HTML].map(mapIt)),
    EXPR: new Map(
      [
        "@",
        "-",
        "+",
        "!",
        "~",
        "(",
        "`",
        this.tok.T_LIST,
        this.tok.T_CLONE,
        this.tok.T_INC,
        this.tok.T_DEC,
        this.tok.T_NEW,
        this.tok.T_ISSET,
        this.tok.T_EMPTY,
        this.tok.T_MATCH,
        this.tok.T_INCLUDE,
        this.tok.T_INCLUDE_ONCE,
        this.tok.T_REQUIRE,
        this.tok.T_REQUIRE_ONCE,
        this.tok.T_EVAL,
        this.tok.T_INT_CAST,
        this.tok.T_DOUBLE_CAST,
        this.tok.T_STRING_CAST,
        this.tok.T_ARRAY_CAST,
        this.tok.T_OBJECT_CAST,
        this.tok.T_BOOL_CAST,
        this.tok.T_UNSET_CAST,
        this.tok.T_EXIT,
        this.tok.T_PRINT,
        this.tok.T_YIELD,
        this.tok.T_STATIC,
        this.tok.T_FUNCTION,
        this.tok.T_FN,
        // using VARIABLES :
        this.tok.T_VARIABLE,
        "$",
        this.tok.T_NS_SEPARATOR,
        this.tok.T_STRING,
        this.tok.T_NAME_RELATIVE,
        this.tok.T_NAME_QUALIFIED,
        this.tok.T_NAME_FULLY_QUALIFIED,
        // using SCALAR :
        this.tok.T_STRING, // @see variable.js line 45 > conflict with variable = shift/reduce :)
        this.tok.T_CONSTANT_ENCAPSED_STRING,
        this.tok.T_START_HEREDOC,
        this.tok.T_LNUMBER,
        this.tok.T_DNUMBER,
        this.tok.T_ARRAY,
        "[",
        this.tok.T_CLASS_C,
        this.tok.T_TRAIT_C,
        this.tok.T_FUNC_C,
        this.tok.T_METHOD_C,
        this.tok.T_LINE,
        this.tok.T_FILE,
        this.tok.T_DIR,
        this.tok.T_NS_C,
        '"',
        'b"',
        'B"',
        "-",
        this.tok.T_NS_SEPARATOR,
      ].map(mapIt)
    ),
  };
};

/**
 * helper : gets a token name
 * @function Parser#getTokenName
 * @memberOf module:php-parser
 */
Parser.prototype.getTokenName = function (token) {
  if (!isNumber(token)) {
    return "'" + token + "'";
  } else {
    if (token == this.EOF) return "the end of file (EOF)";
    return this.lexer.engine.tokens.values[token];
  }
};

/**
 * main entry point : converts a source code to AST
 * @function Parser#parse
 * @memberOf module:php-parser
 */
Parser.prototype.parse = function (code, filename) {
  this._errors = [];
  this.filename = filename || "eval";
  this.currentNamespace = [""];
  if (this.extractDoc) {
    this._docs = [];
  } else {
    this._docs = null;
  }
  if (this.extractTokens) {
    this._tokens = [];
  } else {
    this._tokens = null;
  }
  this._docIndex = 0;
  this._lastNode = null;
  this.lexer.setInput(code);
  this.lexer.all_tokens = this.extractTokens;
  this.lexer.comment_tokens = this.extractDoc;
  this.length = this.lexer._input.length;
  this.innerList = false;
  this.innerListForm = false;
  const program = this.node("program");
  const childs = [];
  this.next();
  while (this.token != this.EOF) {
    childs.push(this.read_start());
  }
  // append last comment
  if (
    childs.length === 0 &&
    this.extractDoc &&
    this._docs.length > this._docIndex
  ) {
    childs.push(this.node("noop")());
  }
  // #176 : register latest position
  this.prev = [
    this.lexer.yylloc.last_line,
    this.lexer.yylloc.last_column,
    this.lexer.offset,
  ];
  const result = program(childs, this._errors, this._docs, this._tokens);
  if (this.debug) {
    const errors = this.ast.checkNodes();
    /* istanbul ignore next */
    if (errors.length > 0) {
      errors.forEach(function (error) {
        if (error.position) {
          // eslint-disable-next-line no-console
          console.log(
            "Node at line " +
              error.position.line +
              ", column " +
              error.position.column
          );
        }
        // eslint-disable-next-line no-console
        console.log(error.stack.join("\n"));
      });
      throw new Error("Some nodes are not closed");
    }
  }
  return result;
};

/**
 * Raise an error
 * @function Parser#raiseError
 * @memberOf module:php-parser
 */
Parser.prototype.raiseError = function (message, msgExpect, expect, token) {
  message += " on line " + this.lexer.yylloc.first_line;
  if (!this.suppressErrors) {
    const err = new SyntaxError(
      message,
      this.filename,
      this.lexer.yylloc.first_line
    );
    err.lineNumber = this.lexer.yylloc.first_line;
    err.fileName = this.filename;
    err.columnNumber = this.lexer.yylloc.first_column;
    throw err;
  }
  // Error node :
  const node = this.ast.prepare("error", null, this)(
    message,
    token,
    this.lexer.yylloc.first_line,
    expect
  );
  this._errors.push(node);
  return node;
};

/**
 * handling errors
 * @function Parser#error
 * @memberOf module:php-parser
 */
Parser.prototype.error = function (expect) {
  let msg = "Parse Error : syntax error";
  let token = this.getTokenName(this.token);
  let msgExpect = "";

  if (this.token !== this.EOF) {
    if (isNumber(this.token)) {
      let symbol = this.text();
      /* istanbul ignore next */
      if (symbol.length > 10) {
        symbol = symbol.substring(0, 7) + "...";
      }
      token = "'" + symbol + "' (" + token + ")";
    }
    msg += ", unexpected " + token;
  }
  if (expect && !Array.isArray(expect)) {
    if (isNumber(expect) || expect.length === 1) {
      msgExpect = ", expecting " + this.getTokenName(expect);
    }
    msg += msgExpect;
  }
  return this.raiseError(msg, msgExpect, expect, token);
};

/**
 * Create a position node from the lexers position
 *
 * @function Parser#position
 * @memberOf module:php-parser
 * @return {Position}
 */
Parser.prototype.position = function () {
  return new Position$1(
    this.lexer.yylloc.first_line,
    this.lexer.yylloc.first_column,
    this.lexer.yylloc.first_offset
  );
};

/**
 * Creates a new AST node
 * @function Parser#node
 * @memberOf module:php-parser
 */
Parser.prototype.node = function (name) {
  if (this.extractDoc) {
    let docs = null;
    if (this._docIndex < this._docs.length) {
      docs = this._docs.slice(this._docIndex);
      this._docIndex = this._docs.length;
      /* istanbul ignore next */
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log(new Error("Append docs on " + name));
        // eslint-disable-next-line no-console
        console.log(docs);
      }
    }
    const node = this.ast.prepare(name, docs, this);
    /*
     * TOKENS :
     * node1 commentA token commmentB node2 commentC token commentD node3 commentE token
     *
     * AST :
     * structure:S1 [
     *    left: node1 ( trail: commentA ),
     *    right: structure:S2 [
     *       node2 (lead: commentB, trail: commentC),
     *       node3 (lead: commentD)
     *    ],
     *    trail: commentE
     * ]
     *
     * Algorithm :
     *
     * Attach the last comments on parent of current node
     * If a new node is started and the parent has a trailing comment
     * the move it on previous node
     *
     * start S2
     * start node1
     * consume node1 & set commentA as trailingComment on S2
     * start S2
     * S1 has a trailingComment, attach it on node1
     * ...
     * NOTE : As the trailingComment Behavior depends on AST, it will be build on
     * the AST layer - last child node will keep it's trailingComment nodes
     */
    node.postBuild = function (self) {
      if (this._docIndex < this._docs.length) {
        if (this._lastNode) {
          const offset = this.prev[2];
          let max = this._docIndex;
          for (; max < this._docs.length; max++) {
            if (this._docs[max].offset > offset) {
              break;
            }
          }
          if (max > this._docIndex) {
            // inject trailing comment on child node
            this._lastNode.setTrailingComments(
              this._docs.slice(this._docIndex, max)
            );
            this._docIndex = max;
          }
        } else if (this.token === this.EOF) {
          // end of content
          self.setTrailingComments(this._docs.slice(this._docIndex));
          this._docIndex = this._docs.length;
        }
      }
      this._lastNode = self;
    }.bind(this);
    return node;
  }
  return this.ast.prepare(name, null, this);
};

/**
 * expects an end of statement or end of file
 * @function Parser#expectEndOfStatement
 * @memberOf module:php-parser
 * @return {boolean}
 */
Parser.prototype.expectEndOfStatement = function (node) {
  if (this.token === ";") {
    // include only real ';' statements
    // https://github.com/glayzzle/php-parser/issues/164
    if (node && this.lexer.yytext === ";") {
      node.includeToken(this);
    }
  } else if (this.token !== this.tok.T_INLINE_HTML && this.token !== this.EOF) {
    this.error(";");
    return false;
  }
  this.next();
  return true;
};

const ignoreStack = ["parser.next", "parser.node", "parser.showlog"];
/**
 * outputs some debug information on current token
 * @private
 * @function Parser#showlog
 * @memberOf module:php-parser
 */
Parser.prototype.showlog = function () {
  const stack = new Error().stack.split("\n");
  let line;
  for (let offset = 2; offset < stack.length; offset++) {
    line = stack[offset].trim();
    let found = false;
    for (let i = 0; i < ignoreStack.length; i++) {
      /* istanbul ignore next */
      if (line.substring(3, 3 + ignoreStack[i].length) === ignoreStack[i]) {
        found = true;
        break;
      }
    }
    /* istanbul ignore next */
    if (!found) {
      break;
    }
  }
  // eslint-disable-next-line no-console
  console.log(
    "Line " +
      this.lexer.yylloc.first_line +
      " : " +
      this.getTokenName(this.token) +
      ">" +
      this.lexer.yytext +
      "<" +
      " @-->" +
      line
  );
  return this;
};

/**
 * Force the parser to check the current token.
 *
 * If the current token does not match to expected token,
 * the an error will be raised.
 *
 * If the suppressError mode is activated, then the error will
 * be added to the program error stack and this function will return `false`.
 *
 * @function Parser#expect
 * @memberOf module:php-parser
 * @param {String|Number} token
 * @return {boolean}
 * @throws Error
 */
Parser.prototype.expect = function (token) {
  if (Array.isArray(token)) {
    if (token.indexOf(this.token) === -1) {
      this.error(token);
      return false;
    }
  } else if (this.token != token) {
    this.error(token);
    return false;
  }
  return true;
};

/**
 * Returns the current token contents
 * @function Parser#text
 * @memberOf module:php-parser
 * @return {String}
 */
Parser.prototype.text = function () {
  return this.lexer.yytext;
};

/**
 * consume the next token
 * @function Parser#next
 * @memberOf module:php-parser
 */
Parser.prototype.next = function () {
  // prepare the back command
  if (this.token !== ";" || this.lexer.yytext === ";") {
    // ignore '?>' from automated resolution
    // https://github.com/glayzzle/php-parser/issues/168
    this.prev = [
      this.lexer.yylloc.last_line,
      this.lexer.yylloc.last_column,
      this.lexer.offset,
    ];
  }

  // eating the token
  this.lex();

  // showing the debug
  if (this.debug) {
    this.showlog();
  }

  // handling comments
  if (this.extractDoc) {
    while (
      this.token === this.tok.T_COMMENT ||
      this.token === this.tok.T_DOC_COMMENT
    ) {
      // APPEND COMMENTS
      if (this.token === this.tok.T_COMMENT) {
        this._docs.push(this.read_comment());
      } else {
        this._docs.push(this.read_doc_comment());
      }
    }
  }

  return this;
};

/**
 * Peek at the next token.
 * @function Parser#peek
 * @memberOf module:php-parser
 * @returns {string|number} Next Token
 */
Parser.prototype.peek = function () {
  const lexerState = this.lexer.getState();
  const nextToken = this.lexer.lex();
  this.lexer.setState(lexerState);
  return nextToken;
};

/**
 * Eating a token
 * @function Parser#lex
 * @memberOf module:php-parser
 */
Parser.prototype.lex = function () {
  // append on token stack
  if (this.extractTokens) {
    do {
      // the token
      this.token = this.lexer.lex() || /* istanbul ignore next */ this.EOF;
      if (this.token === this.EOF) return this;
      let entry = this.lexer.yytext;
      if (
        Object.prototype.hasOwnProperty.call(
          this.lexer.engine.tokens.values,
          this.token
        )
      ) {
        entry = [
          this.lexer.engine.tokens.values[this.token],
          entry,
          this.lexer.yylloc.first_line,
          this.lexer.yylloc.first_offset,
          this.lexer.offset,
        ];
      } else {
        entry = [
          null,
          entry,
          this.lexer.yylloc.first_line,
          this.lexer.yylloc.first_offset,
          this.lexer.offset,
        ];
      }
      this._tokens.push(entry);
      if (this.token === this.tok.T_CLOSE_TAG) {
        // https://github.com/php/php-src/blob/7ff186434e82ee7be7c59d0db9a976641cf7b09c/Zend/zend_compile.c#L1680
        this.token = ";";
        return this;
      } else if (this.token === this.tok.T_OPEN_TAG_WITH_ECHO) {
        this.token = this.tok.T_ECHO;
        return this;
      }
    } while (
      this.token === this.tok.T_WHITESPACE || // ignore white space
      (!this.extractDoc &&
        (this.token === this.tok.T_COMMENT || // ignore single lines comments
          this.token === this.tok.T_DOC_COMMENT)) || // ignore doc comments
      // ignore open tags
      this.token === this.tok.T_OPEN_TAG
    );
  } else {
    this.token = this.lexer.lex() || /* istanbul ignore next */ this.EOF;
  }
  return this;
};

/**
 * Check if token is of specified type
 * @function Parser#is
 * @memberOf module:php-parser
 */
Parser.prototype.is = function (type) {
  if (Array.isArray(type)) {
    return type.indexOf(this.token) !== -1;
  }
  return this.entries[type].has(this.token);
};

// extends the parser with syntax files
[
  array$1,
  _class$1,
  comment$1,
  expr,
  _enum$1,
  _function$1,
  _if$1,
  loops,
  main,
  namespace$1,
  scalar,
  statement$1,
  _switch$1,
  _try$1,
  utils,
  variable$1,
].forEach(function (ext) {
  for (const k in ext) {
    /* istanbul ignore next */
    if (Object.prototype.hasOwnProperty.call(Parser.prototype, k)) {
      // @see https://github.com/glayzzle/php-parser/issues/234
      throw new Error("Function " + k + " is already defined - collision");
    }
    Parser.prototype[k] = ext[k];
  }
});

var parser$1 = Parser;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

/**
 * @readonly
 * @memberOf module:php-parser
 *
 * @enum {number}
 **/
const TokenNames = {
  T_HALT_COMPILER: 101,
  T_USE: 102,
  T_ENCAPSED_AND_WHITESPACE: 103,
  T_OBJECT_OPERATOR: 104,
  T_STRING: 105,
  T_DOLLAR_OPEN_CURLY_BRACES: 106,
  T_STRING_VARNAME: 107,
  T_CURLY_OPEN: 108,
  T_NUM_STRING: 109,
  T_ISSET: 110,
  T_EMPTY: 111,
  T_INCLUDE: 112,
  T_INCLUDE_ONCE: 113,
  T_EVAL: 114,
  T_REQUIRE: 115,
  T_REQUIRE_ONCE: 116,
  T_NAMESPACE: 117,
  T_NS_SEPARATOR: 118,
  T_AS: 119,
  T_IF: 120,
  T_ENDIF: 121,
  T_WHILE: 122,
  T_DO: 123,
  T_FOR: 124,
  T_SWITCH: 125,
  T_BREAK: 126,
  T_CONTINUE: 127,
  T_RETURN: 128,
  T_GLOBAL: 129,
  T_STATIC: 130,
  T_ECHO: 131,
  T_INLINE_HTML: 132,
  T_UNSET: 133,
  T_FOREACH: 134,
  T_DECLARE: 135,
  T_TRY: 136,
  T_THROW: 137,
  T_GOTO: 138,
  T_FINALLY: 139,
  T_CATCH: 140,
  T_ENDDECLARE: 141,
  T_LIST: 142,
  T_CLONE: 143,
  T_PLUS_EQUAL: 144,
  T_MINUS_EQUAL: 145,
  T_MUL_EQUAL: 146,
  T_DIV_EQUAL: 147,
  T_CONCAT_EQUAL: 148,
  T_MOD_EQUAL: 149,
  T_AND_EQUAL: 150,
  T_OR_EQUAL: 151,
  T_XOR_EQUAL: 152,
  T_SL_EQUAL: 153,
  T_SR_EQUAL: 154,
  T_INC: 155,
  T_DEC: 156,
  T_BOOLEAN_OR: 157,
  T_BOOLEAN_AND: 158,
  T_LOGICAL_OR: 159,
  T_LOGICAL_AND: 160,
  T_LOGICAL_XOR: 161,
  T_SL: 162,
  T_SR: 163,
  T_IS_IDENTICAL: 164,
  T_IS_NOT_IDENTICAL: 165,
  T_IS_EQUAL: 166,
  T_IS_NOT_EQUAL: 167,
  T_IS_SMALLER_OR_EQUAL: 168,
  T_IS_GREATER_OR_EQUAL: 169,
  T_INSTANCEOF: 170,
  T_INT_CAST: 171,
  T_DOUBLE_CAST: 172,
  T_STRING_CAST: 173,
  T_ARRAY_CAST: 174,
  T_OBJECT_CAST: 175,
  T_BOOL_CAST: 176,
  T_UNSET_CAST: 177,
  T_EXIT: 178,
  T_PRINT: 179,
  T_YIELD: 180,
  T_YIELD_FROM: 181,
  T_FUNCTION: 182,
  T_DOUBLE_ARROW: 183,
  T_DOUBLE_COLON: 184,
  T_ARRAY: 185,
  T_CALLABLE: 186,
  T_CLASS: 187,
  T_ABSTRACT: 188,
  T_TRAIT: 189,
  T_FINAL: 190,
  T_EXTENDS: 191,
  T_INTERFACE: 192,
  T_IMPLEMENTS: 193,
  T_VAR: 194,
  T_PUBLIC: 195,
  T_PROTECTED: 196,
  T_PRIVATE: 197,
  T_CONST: 198,
  T_NEW: 199,
  T_INSTEADOF: 200,
  T_ELSEIF: 201,
  T_ELSE: 202,
  T_ENDSWITCH: 203,
  T_CASE: 204,
  T_DEFAULT: 205,
  T_ENDFOR: 206,
  T_ENDFOREACH: 207,
  T_ENDWHILE: 208,
  T_CONSTANT_ENCAPSED_STRING: 209,
  T_LNUMBER: 210,
  T_DNUMBER: 211,
  T_LINE: 212,
  T_FILE: 213,
  T_DIR: 214,
  T_TRAIT_C: 215,
  T_METHOD_C: 216,
  T_FUNC_C: 217,
  T_NS_C: 218,
  T_START_HEREDOC: 219,
  T_END_HEREDOC: 220,
  T_CLASS_C: 221,
  T_VARIABLE: 222,
  T_OPEN_TAG: 223,
  T_OPEN_TAG_WITH_ECHO: 224,
  T_CLOSE_TAG: 225,
  T_WHITESPACE: 226,
  T_COMMENT: 227,
  T_DOC_COMMENT: 228,
  T_ELLIPSIS: 229,
  T_COALESCE: 230,
  T_POW: 231,
  T_POW_EQUAL: 232,
  T_SPACESHIP: 233,
  T_COALESCE_EQUAL: 234,
  T_FN: 235,
  T_NULLSAFE_OBJECT_OPERATOR: 236,
  T_MATCH: 237,
  T_ATTRIBUTE: 238,
  T_ENUM: 239,
  T_READ_ONLY: 240,
  T_NAME_RELATIVE: 241,
  T_NAME_QUALIFIED: 242,
  T_NAME_FULLY_QUALIFIED: 243,
};

/**
 * PHP AST Tokens
 * @readonly
 * @memberOf module:php-parser
 *
 * @type {object}
 * @property {Object.<number, string>} values
 * @property {TokenNames} names
 */
const tokens$1 = {
  values: Object.entries(TokenNames).reduce(
    (result, [key, value]) => ({ ...result, [value]: key }),
    {}
  ),
  names: TokenNames,
};

var tokens_1 = Object.freeze(tokens$1);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

/**
 * Defines the location of the node (with it's source contents as string)
 * @constructor Location
 * @memberOf module:php-parser
 * @property {string|null} source
 * @property {Position} start
 * @property {Position} end
 */
const Location$1 = function (source, start, end) {
  this.source = source;
  this.start = start;
  this.end = end;
};

var location = Location$1;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

/**
 * A generic AST node
 * @constructor Node
 * @memberOf module:php-parser
 * @property {Location|null} loc
 * @property {CommentBlock[]|Comment[]|null} leadingComments
 * @property {CommentBlock[]|Comment[]|null} trailingComments
 * @property {string} kind
 */
const Node$i = function Node(kind, docs, location) {
  this.kind = kind;
  if (docs) {
    this.leadingComments = docs;
  }
  if (location) {
    this.loc = location;
  }
};

/**
 * Attach comments to current node
 * @function Node#setTrailingComments
 * @memberOf module:php-parser
 * @param {*} docs
 */
Node$i.prototype.setTrailingComments = function (docs) {
  this.trailingComments = docs;
};

/**
 * Destroying an unused node
 * @function Node#destroy
 * @memberOf module:php-parser
 */
Node$i.prototype.destroy = function (node) {
  if (!node) {
    /* istanbul ignore next */
    throw new Error(
      "Node already initialized, you must swap with another node"
    );
  }
  if (this.leadingComments) {
    if (node.leadingComments) {
      node.leadingComments = Array.concat(
        this.leadingComments,
        node.leadingComments
      );
    } else {
      node.leadingComments = this.leadingComments;
    }
  }
  if (this.trailingComments) {
    if (node.trailingComments) {
      node.trailingComments = Array.concat(
        this.trailingComments,
        node.trailingComments
      );
    } else {
      node.trailingComments = this.trailingComments;
    }
  }
  return node;
};

/**
 * Includes current token position of the parser
 * @function Node#includeToken
 * @memberOf module:php-parser
 * @param {*} parser
 */
Node$i.prototype.includeToken = function (parser) {
  if (this.loc) {
    if (this.loc.end) {
      this.loc.end.line = parser.lexer.yylloc.last_line;
      this.loc.end.column = parser.lexer.yylloc.last_column;
      this.loc.end.offset = parser.lexer.offset;
    }
    if (parser.ast.withSource) {
      this.loc.source = parser.lexer._input.substring(
        this.loc.start.offset,
        parser.lexer.offset
      );
    }
  }
  return this;
};

/**
 * Helper for extending the Node class
 * @function Node.extends
 * @memberOf module:php-parser
 * @param {string} type
 * @param {Function} constructor
 * @return {Function}
 */
Node$i.extends = function (type, constructor) {
  constructor.prototype = Object.create(this.prototype);
  constructor.extends = this.extends;
  constructor.prototype.constructor = constructor;
  constructor.kind = type;
  return constructor;
};

var node = Node$i;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$h = node;
const KIND$1K = "expression";

/**
 * Any expression node. Since the left-hand side of an assignment may
 * be any expression in general, an expression can also be a pattern.
 * @constructor Expression
 * @memberOf module:php-parser
 * @extends {Node}
 */
var expression = Node$h.extends(KIND$1K, function Expression(kind, docs, location) {
  Node$h.apply(this, [kind || KIND$1K, docs, location]);
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expr$2 = expression;
const KIND$1J = "array";

/**
 * Defines an array structure
 * @constructor Array
 * @memberOf module:php-parser
 * @example
 * // PHP code :
 * [1, 'foo' => 'bar', 3]
 *
 * // AST structure :
 * {
 *  "kind": "array",
 *  "shortForm": true
 *  "items": [
 *    {"kind": "number", "value": "1"},
 *    {
 *      "kind": "entry",
 *      "key": {"kind": "string", "value": "foo", "isDoubleQuote": false},
 *      "value": {"kind": "string", "value": "bar", "isDoubleQuote": false}
 *    },
 *    {"kind": "number", "value": "3"}
 *  ]
 * }
 * @extends {Expression}
 * @property {Array<Entry|Expression|Variable>} items List of array items
 * @property {boolean} shortForm Indicate if the short array syntax is used, ex `[]` instead `array()`
 */
var array = Expr$2.extends(
  KIND$1J,
  function Array(shortForm, items, docs, location) {
    Expr$2.apply(this, [KIND$1J, docs, location]);
    this.items = items;
    this.shortForm = shortForm;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$q = expression;
const KIND$1I = "arrowfunc";

/**
 * Defines an arrow function (it's like a closure)
 * @constructor ArrowFunc
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Parameter[]} arguments
 * @property {Identifier} type
 * @property {Expression} body
 * @property {boolean} byref
 * @property {boolean} nullable
 * @property {boolean} isStatic
 */
var arrowfunc = Expression$q.extends(
  KIND$1I,
  function Closure(
    args,
    byref,
    body,
    type,
    nullable,
    isStatic,
    docs,
    location
  ) {
    Expression$q.apply(this, [KIND$1I, docs, location]);
    this.arguments = args;
    this.byref = byref;
    this.body = body;
    this.type = type;
    this.nullable = nullable;
    this.isStatic = isStatic || false;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$p = expression;
const KIND$1H = "assign";

/**
 * Assigns a value to the specified target
 * @constructor Assign
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} left
 * @property {Expression} right
 * @property {String} operator
 */
var assign = Expression$p.extends(
  KIND$1H,
  function Assign(left, right, operator, docs, location) {
    Expression$p.apply(this, [KIND$1H, docs, location]);
    this.left = left;
    this.right = right;
    this.operator = operator;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$o = expression;
const KIND$1G = "assignref";

/**
 * Assigns a value to the specified target
 * @constructor AssignRef
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} left
 * @property {Expression} right
 * @property {String} operator
 */
var assignref = Expression$o.extends(
  KIND$1G,
  function AssignRef(left, right, docs, location) {
    Expression$o.apply(this, [KIND$1G, docs, location]);
    this.left = left;
    this.right = right;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$g = node;
const KIND$1F = "attribute";

/**
 * Attribute Value
 * @memberOf module:php-parser
 * @constructor Attribute
 * @extends {Node}
 * @property {String} name
 * @property {Parameter[]} args
 */
var attribute = Node$g.extends(
  KIND$1F,
  function Attribute(name, args, docs, location) {
    Node$g.apply(this, [KIND$1F, docs, location]);
    this.name = name;
    this.args = args;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$f = node;
const KIND$1E = "attrgroup";

/**
 * Attribute group
 * @memberOf module:php-parser
 * @constructor AttrGroup
 * @extends {Node}
 * @property {Attribute[]} attrs
 */
var attrgroup = Node$f.extends(KIND$1E, function AttrGroup(attrs, docs, location) {
  Node$f.apply(this, [KIND$1E, docs, location]);
  this.attrs = attrs || [];
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expr$1 = expression;
const KIND$1D = "operation";

/**
 * Defines binary operations
 * @constructor Operation
 * @memberOf module:php-parser
 * @extends {Expression}
 */
var operation = Expr$1.extends(KIND$1D, function Operation(kind, docs, location) {
  Expr$1.apply(this, [kind || KIND$1D, docs, location]);
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Operation$4 = operation;
const KIND$1C = "bin";
/**
 * Binary operations
 * @constructor Bin
 * @memberOf module:php-parser
 * @extends {Operation}
 * @property {String} type
 * @property {Expression} left
 * @property {Expression} right
 */
var bin = Operation$4.extends(
  KIND$1C,
  function Bin(type, left, right, docs, location) {
    Operation$4.apply(this, [KIND$1C, docs, location]);
    this.type = type;
    this.left = left;
    this.right = right;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$e = node;
const KIND$1B = "statement";

/**
 * Any statement.
 * @constructor Statement
 * @memberOf module:php-parser
 * @extends {Node}
 */
var statement = Node$e.extends(KIND$1B, function Statement(kind, docs, location) {
  Node$e.apply(this, [kind || KIND$1B, docs, location]);
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$r = statement;
const KIND$1A = "block";

/**
 * A block statement, i.e., a sequence of statements surrounded by braces.
 * @constructor Block
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Node[]} children
 */
var block = Statement$r.extends(
  KIND$1A,
  function Block(kind, children, docs, location) {
    Statement$r.apply(this, [kind || KIND$1A, docs, location]);
    this.children = children.filter(Boolean);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$n = expression;
const KIND$1z = "literal";

/**
 * Defines an array structure
 * @constructor Literal
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {string} raw
 * @property {EncapsedPart[]|Node|string|number|boolean|null} value
 */
var literal = Expression$n.extends(
  KIND$1z,
  function Literal(kind, value, raw, docs, location) {
    Expression$n.apply(this, [kind || KIND$1z, docs, location]);
    this.value = value;
    if (raw) {
      this.raw = raw;
    }
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Literal$6 = literal;
const KIND$1y = "boolean";

/**
 * Defines a boolean value (true/false)
 * @constructor Boolean
 * @memberOf module:php-parser
 * @extends {Literal}
 * @property {boolean} value
 */
var boolean = Literal$6.extends(
  KIND$1y,
  function Boolean(value, raw, docs, location) {
    Literal$6.apply(this, [KIND$1y, value, raw, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$q = statement;
const KIND$1x = "break";

/**
 * A break statement
 * @constructor Break
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Number|Null} level
 */
var _break = Statement$q.extends(KIND$1x, function Break(level, docs, location) {
  Statement$q.apply(this, [KIND$1x, docs, location]);
  this.level = level;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$m = expression;
const KIND$1w = "byref";

/**
 * Passing by Reference - so the function can modify the variable
 * @constructor ByRef
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {ExpressionStatement} what
 */
var byref = Expression$m.extends(KIND$1w, function ByRef(what, docs, location) {
  Expression$m.apply(this, [KIND$1w, docs, location]);
  this.what = what;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$l = expression;
const KIND$1v = "call";

/**
 * Executes a call statement
 * @constructor Call
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Identifier|Variable} what
 * @property {Expression[]} arguments
 */
var call = Expression$l.extends(
  KIND$1v,
  function Call(what, args, docs, location) {
    Expression$l.apply(this, [KIND$1v, docs, location]);
    this.what = what;
    this.arguments = args;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$p = statement;
const KIND$1u = "case";

/**
 * A switch case statement
 * @constructor Case
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression|null} test - if null, means that the default case
 * @property {Block|null} body
 */
var _case = Statement$p.extends(
  KIND$1u,
  function Case(test, body, docs, location) {
    Statement$p.apply(this, [KIND$1u, docs, location]);
    this.test = test;
    this.body = body;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Operation$3 = operation;
const KIND$1t = "cast";

/**
 * Binary operations
 * @constructor Cast
 * @memberOf module:php-parser
 * @extends {Operation}
 * @property {String} type
 * @property {String} raw
 * @property {Expression} expr
 */
var cast = Operation$3.extends(
  KIND$1t,
  function Cast(type, raw, expr, docs, location) {
    Operation$3.apply(this, [KIND$1t, docs, location]);
    this.type = type;
    this.raw = raw;
    this.expr = expr;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$o = statement;
const KIND$1s = "catch";

/**
 * Defines a catch statement
 * @constructor Catch
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Name[]} what
 * @property {Variable} variable
 * @property {Block} body
 * @see http://php.net/manual/en/language.exceptions.php
 */
var _catch = Statement$o.extends(
  KIND$1s,
  function Catch(body, what, variable, docs, location) {
    Statement$o.apply(this, [KIND$1s, docs, location]);
    this.body = body;
    this.what = what;
    this.variable = variable;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$n = statement;
const KIND$1r = "declaration";

const IS_UNDEFINED$3 = "";
const IS_PUBLIC$3 = "public";
const IS_PROTECTED$3 = "protected";
const IS_PRIVATE$3 = "private";

/**
 * A declaration statement (function, class, interface...)
 * @constructor Declaration
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Identifier|string} name
 */
const Declaration$8 = Statement$n.extends(
  KIND$1r,
  function Declaration(kind, name, docs, location) {
    Statement$n.apply(this, [kind || KIND$1r, docs, location]);
    this.name = name;
  }
);

/**
 * Generic flags parser
 * @function
 * @name Declaration#parseFlags
 * @memberOf module:php-parser
 * @param {Array<number|null>} flags
 * @return {void}
 */
Declaration$8.prototype.parseFlags = function (flags) {
  this.isAbstract = flags[2] === 1;
  this.isFinal = flags[2] === 2;
  this.isReadonly = flags[3] === 1;
  if (this.kind !== "class") {
    if (flags[0] === -1) {
      this.visibility = IS_UNDEFINED$3;
    } else if (flags[0] === null) {
      /* istanbul ignore next */
      this.visibility = null;
    } else if (flags[0] === 0) {
      this.visibility = IS_PUBLIC$3;
    } else if (flags[0] === 1) {
      this.visibility = IS_PROTECTED$3;
    } else if (flags[0] === 2) {
      this.visibility = IS_PRIVATE$3;
    }
    this.isStatic = flags[1] === 1;
  }
};

var declaration = Declaration$8;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration$7 = declaration;
const KIND$1q = "class";

/**
 * A class definition
 * @constructor Class
 * @memberOf module:php-parser
 * @extends {Declaration}
 * @property {Identifier|null} extends
 * @property {Identifier[]|null} implements
 * @property {Declaration[]} body
 * @property {boolean} isAnonymous
 * @property {boolean} isAbstract
 * @property {boolean} isFinal
 * @property {boolean} isReadonly
 * @property {AttrGroup[]} attrGroups
 */
var _class = Declaration$7.extends(
  KIND$1q,
  function Class(name, ext, impl, body, flags, docs, location) {
    Declaration$7.apply(this, [KIND$1q, name, docs, location]);
    this.isAnonymous = name ? false : true;
    this.extends = ext;
    this.implements = impl;
    this.body = body;
    this.attrGroups = [];
    this.parseFlags(flags);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$m = statement;
const KIND$1p = "constantstatement";

/**
 * Declares a constants into the current scope
 * @constructor ConstantStatement
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Constant[]} constants
 */
var constantstatement = Statement$m.extends(
  KIND$1p,
  function ConstantStatement(kind, constants, docs, location) {
    Statement$m.apply(this, [kind || KIND$1p, docs, location]);
    this.constants = constants;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const ConstantStatement = constantstatement;
const KIND$1o = "classconstant";

const IS_UNDEFINED$2 = "";
const IS_PUBLIC$2 = "public";
const IS_PROTECTED$2 = "protected";
const IS_PRIVATE$2 = "private";

/**
 * Defines a class/interface/trait constant
 * @constructor ClassConstant
 * @memberOf module:php-parser
 * @extends {ConstantStatement}
 * @property {string} visibility
 * @property {bool} final
 * @property {AttrGroup[]} attrGroups
 */
const ClassConstant = ConstantStatement.extends(
  KIND$1o,
  function ClassConstant(kind, constants, flags, attrGroups, docs, location) {
    ConstantStatement.apply(this, [kind || KIND$1o, constants, docs, location]);
    this.parseFlags(flags);
    this.attrGroups = attrGroups;
  }
);

/**
 * Generic flags parser
 * @function
 * @name ClassConstant#parseFlags
 * @memberOf module:php-parser
 * @param {Array<number|null>} flags
 * @return {void}
 */
ClassConstant.prototype.parseFlags = function (flags) {
  if (flags[0] === -1) {
    this.visibility = IS_UNDEFINED$2;
  } else if (flags[0] === null) {
    /* istanbul ignore next */
    this.visibility = null;
  } else if (flags[0] === 0) {
    this.visibility = IS_PUBLIC$2;
  } else if (flags[0] === 1) {
    this.visibility = IS_PROTECTED$2;
  } else if (flags[0] === 2) {
    this.visibility = IS_PRIVATE$2;
  }
  this.final = flags[2] === 2;
};

var classconstant = ClassConstant;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$k = expression;
const KIND$1n = "clone";

/**
 * Defines a clone call
 * @constructor Clone
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} what
 */
var clone = Expression$k.extends(KIND$1n, function Clone(what, docs, location) {
  Expression$k.apply(this, [KIND$1n, docs, location]);
  this.what = what;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$j = expression;
const KIND$1m = "closure";

/**
 * Defines a closure
 * @constructor Closure
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Parameter[]} arguments
 * @property {Variable[]} uses
 * @property {Identifier} type
 * @property {Boolean} byref
 * @property {boolean} nullable
 * @property {Block|null} body
 * @property {boolean} isStatic
 * @property {AttrGroup[]} attrGroups
 */
var closure = Expression$j.extends(
  KIND$1m,
  function Closure(
    args,
    byref,
    uses,
    type,
    nullable,
    isStatic,
    docs,
    location
  ) {
    Expression$j.apply(this, [KIND$1m, docs, location]);
    this.uses = uses;
    this.arguments = args;
    this.byref = byref;
    this.type = type;
    this.nullable = nullable;
    this.isStatic = isStatic || false;
    this.body = null;
    this.attrGroups = [];
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$d = node;

/**
 * Abstract documentation node (ComentLine or CommentBlock)
 * @constructor Comment
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {String} value
 */
var comment = Node$d.extends(
  "comment",
  function Comment(kind, value, docs, location) {
    Node$d.apply(this, [kind, docs, location]);
    this.value = value;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Comment$1 = comment;
const KIND$1l = "commentblock";

/**
 * A comment block (multiline)
 * @constructor CommentBlock
 * @memberOf module:php-parser
 * @extends {Comment}
 */
var commentblock = Comment$1.extends(
  KIND$1l,
  function CommentBlock(value, docs, location) {
    Comment$1.apply(this, [KIND$1l, value, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Comment = comment;
const KIND$1k = "commentline";

/**
 * A single line comment
 * @constructor CommentLine
 * @memberOf module:php-parser
 * @extends {Comment}
 */
var commentline = Comment.extends(
  KIND$1k,
  function CommentLine(value, docs, location) {
    Comment.apply(this, [KIND$1k, value, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$c = node;
const KIND$1j = "constant";

/**
 * Defines a constant
 * @constructor Constant
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {string} name
 * @property {Node|string|number|boolean|null} value
 */
var constant = Node$c.extends(
  KIND$1j,
  function Constant(name, value, docs, location) {
    Node$c.apply(this, [KIND$1j, docs, location]);
    this.name = name;
    this.value = value;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$l = statement;
const KIND$1i = "continue";

/**
 * A continue statement
 * @constructor Continue
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {number|null} level
 */
var _continue = Statement$l.extends(
  KIND$1i,
  function Continue(level, docs, location) {
    Statement$l.apply(this, [KIND$1i, docs, location]);
    this.level = level;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Block$2 = block;
const KIND$1h = "declare";

/**
 * The declare construct is used to set execution directives for a block of code
 * @constructor Declare
 * @memberOf module:php-parser
 * @extends {Block}
 * @property {DeclareDirective[]} directives
 * @property {string} mode
 * @see http://php.net/manual/en/control-structures.declare.php
 */
const Declare = Block$2.extends(
  KIND$1h,
  function Declare(directives, body, mode, docs, location) {
    Block$2.apply(this, [KIND$1h, body, docs, location]);
    this.directives = directives;
    this.mode = mode;
  }
);

/**
 * The node is declared as a short tag syntax :
 * ```php
 * <?php
 * declare(ticks=1):
 * // some statements
 * enddeclare;
 * ```
 * @constant {String} Declare#MODE_SHORT
 * @memberOf module:php-parser
 */
Declare.MODE_SHORT = "short";

/**
 * The node is declared bracket enclosed code :
 * ```php
 * <?php
 * declare(ticks=1) {
 * // some statements
 * }
 * ```
 * @constant {String} Declare#MODE_BLOCK
 * @memberOf module:php-parser
 */
Declare.MODE_BLOCK = "block";

/**
 * The node is declared as a simple statement. In order to make things simpler
 * children of the node are automatically collected until the next
 * declare statement.
 * ```php
 * <?php
 * declare(ticks=1);
 * // some statements
 * declare(ticks=2);
 * // some statements
 * ```
 * @constant {String} Declare#MODE_NONE
 * @memberOf module:php-parser
 */
Declare.MODE_NONE = "none";

var declare = Declare;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$b = node;
const KIND$1g = "declaredirective";

/**
 * Defines a constant
 * @constructor DeclareDirective
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {Identifier} key
 * @property {Node|string|number|boolean|null} value
 */
var declaredirective = Node$b.extends(
  KIND$1g,
  function DeclareDirective(key, value, docs, location) {
    Node$b.apply(this, [KIND$1g, docs, location]);
    this.key = key;
    this.value = value;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$k = statement;
const KIND$1f = "do";

/**
 * Defines a do/while statement
 * @constructor Do
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression} test
 * @property {Block | null} body
 */
var _do = Statement$k.extends(
  KIND$1f,
  function Do(test, body, docs, location) {
    Statement$k.apply(this, [KIND$1f, docs, location]);
    this.test = test;
    this.body = body;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$j = statement;
const KIND$1e = "echo";

/**
 * Defines system based call
 * @constructor Echo
 * @memberOf module:php-parser
 * @property {boolean} shortForm
 * @property {Expression[]} expressions
 * @extends {Statement}
 */
var echo = Statement$j.extends(
  KIND$1e,
  function Echo(expressions, shortForm, docs, location) {
    Statement$j.apply(this, [KIND$1e, docs, location]);
    this.shortForm = shortForm;
    this.expressions = expressions;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$i = expression;
const KIND$1d = "empty";

/**
 * Defines an empty check call
 * @constructor Empty
 * @memberOf module:php-parser
 * @extends {Expression}
 */
var empty = Expression$i.extends(
  KIND$1d,
  function Empty(expression, docs, location) {
    Expression$i.apply(this, [KIND$1d, docs, location]);
    this.expression = expression;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Literal$5 = literal;
const KIND$1c = "encapsed";

/**
 * Defines an encapsed string (contains expressions)
 * @constructor Encapsed
 * @memberOf module:php-parser
 * @extends {Literal}
 * @property {String} type - Defines the type of encapsed string (shell, heredoc, string)
 * @property {String|Null} label - The heredoc label, defined only when the type is heredoc
 * @property {EncapsedPart[]} value
 */
const Encapsed = Literal$5.extends(
  KIND$1c,
  function Encapsed(value, raw, type, docs, location) {
    Literal$5.apply(this, [KIND$1c, value, raw, docs, location]);
    this.type = type;
  }
);

/**
 * The node is a double quote string :
 * ```php
 * <?php
 * echo "hello $world";
 * ```
 * @constant {String} Encapsed#TYPE_STRING - `string`
 * @memberOf module:php-parser
 */
Encapsed.TYPE_STRING = "string";

/**
 * The node is a shell execute string :
 * ```php
 * <?php
 * echo `ls -larth $path`;
 * ```
 * @constant {String} Encapsed#TYPE_SHELL - `shell`
 * @memberOf module:php-parser
 */
Encapsed.TYPE_SHELL = "shell";

/**
 * The node is a shell execute string :
 * ```php
 * <?php
 * echo <<<STR
 *  Hello $world
 * STR
 * ;
 * ```
 * @constant {String} Encapsed#TYPE_HEREDOC - `heredoc`
 * @memberOf module:php-parser
 */
Encapsed.TYPE_HEREDOC = "heredoc";

/**
 * The node contains a list of constref / variables / expr :
 * ```php
 * <?php
 * echo $foo->bar_$baz;
 * ```
 * @constant {String} Encapsed#TYPE_OFFSET - `offset`
 * @memberOf module:php-parser
 */
Encapsed.TYPE_OFFSET = "offset";

var encapsed = Encapsed;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$h = expression;
const KIND$1b = "encapsedpart";

/**
 * Part of `Encapsed` node
 * @constructor EncapsedPart
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} expression
 * @property {String} syntax
 * @property {Boolean} curly
 */
var encapsedpart = Expression$h.extends(
  KIND$1b,
  function EncapsedPart(expression, syntax, curly, docs, location) {
    Expression$h.apply(this, [KIND$1b, docs, location]);
    this.expression = expression;
    this.syntax = syntax;
    this.curly = curly;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$g = expression;
const KIND$1a = "entry";

/**
 * An array entry - see [Array](#array)
 * @memberOf module:php-parser
 * @constructor Entry
 * @extends {Expression}
 * @property {Node|null} key The entry key/offset
 * @property {Node} value The entry value
 * @property {Boolean} byRef By reference
 * @property {Boolean} unpack Argument unpacking
 */
var entry = Expression$g.extends(
  KIND$1a,
  function Entry(key, value, byRef, unpack, docs, location) {
    Expression$g.apply(this, [KIND$1a, docs, location]);
    this.key = key;
    this.value = value;
    this.byRef = byRef;
    this.unpack = unpack;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration$6 = declaration;
const KIND$19 = "enum";

/**
 * A enum definition
 * @constructor Enum
 * @memberOf module:php-parser
 * @extends {Declaration}
 * @property {Identifier|null} valueType
 * @property {Identifier[]} implements
 * @property {Declaration[]} body
 * @property {AttrGroup[]} attrGroups
 */
var _enum = Declaration$6.extends(
  KIND$19,
  function Enum(name, valueType, impl, body, docs, location) {
    Declaration$6.apply(this, [KIND$19, name, docs, location]);
    this.valueType = valueType;
    this.implements = impl;
    this.body = body;
    this.attrGroups = [];
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$a = node;
const KIND$18 = "enumcase";

/**
 * Declares a cases into the current scope
 * @constructor EnumCase
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {string} name
 * @property {string|number|null} value
 */
var enumcase = Node$a.extends(
  KIND$18,
  function EnumCase(name, value, docs, location) {
    Node$a.apply(this, [KIND$18, docs, location]);
    this.name = name;
    this.value = value;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$9 = node;
const KIND$17 = "error";

/**
 * Defines an error node (used only on silentMode)
 * @constructor Error
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {string} message
 * @property {number} line
 * @property {number|string} token
 * @property {string|array} expected
 */
var error = Node$9.extends(
  KIND$17,
  function Error(message, token, line, expected, docs, location) {
    Node$9.apply(this, [KIND$17, docs, location]);
    this.message = message;
    this.token = token;
    this.line = line;
    this.expected = expected;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$f = expression;
const KIND$16 = "eval";

/**
 * Defines an eval statement
 * @constructor Eval
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Node} source
 */
var _eval = Expression$f.extends(
  KIND$16,
  function Eval(source, docs, location) {
    Expression$f.apply(this, [KIND$16, docs, location]);
    this.source = source;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$e = expression;
const KIND$15 = "exit";

/**
 * Defines an exit / die call
 * @constructor Exit
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Node|null} expression
 * @property {boolean} useDie
 */
var exit = Expression$e.extends(
  KIND$15,
  function Exit(expression, useDie, docs, location) {
    Expression$e.apply(this, [KIND$15, docs, location]);
    this.expression = expression;
    this.useDie = useDie;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$i = statement;
const KIND$14 = "expressionstatement";

/**
 * Defines an expression based statement
 * @constructor ExpressionStatement
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression} expression
 */
var expressionstatement = Statement$i.extends(
  KIND$14,
  function ExpressionStatement(expr, docs, location) {
    Statement$i.apply(this, [KIND$14, docs, location]);
    this.expression = expr;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$h = statement;
const KIND$13 = "for";

/**
 * Defines a for iterator
 * @constructor For
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression[]} init
 * @property {Expression[]} test
 * @property {Expression[]} increment
 * @property {Block | null} body
 * @property {boolean} shortForm
 * @see http://php.net/manual/en/control-structures.for.php
 */
var _for = Statement$h.extends(
  KIND$13,
  function For(init, test, increment, body, shortForm, docs, location) {
    Statement$h.apply(this, [KIND$13, docs, location]);
    this.init = init;
    this.test = test;
    this.increment = increment;
    this.shortForm = shortForm;
    this.body = body;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$g = statement;
const KIND$12 = "foreach";

/**
 * Defines a foreach iterator
 * @constructor Foreach
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression} source
 * @property {Expression|null} key
 * @property {Expression} value
 * @property {Block | null} body
 * @property {boolean} shortForm
 * @see http://php.net/manual/en/control-structures.foreach.php
 */
var foreach = Statement$g.extends(
  KIND$12,
  function Foreach(source, key, value, body, shortForm, docs, location) {
    Statement$g.apply(this, [KIND$12, docs, location]);
    this.source = source;
    this.key = key;
    this.value = value;
    this.shortForm = shortForm;
    this.body = body;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration$5 = declaration;
const KIND$11 = "function";

/**
 * Defines a classic function
 * @constructor Function
 * @memberOf module:php-parser
 * @extends {Declaration}
 * @property {Parameter[]} arguments
 * @property {Identifier} type
 * @property {boolean} byref
 * @property {boolean} nullable
 * @property {Block|null} body
 * @property {AttrGroup[]} attrGroups
 */
var _function = Declaration$5.extends(
  KIND$11,
  function _Function(name, args, byref, type, nullable, docs, location) {
    Declaration$5.apply(this, [KIND$11, name, docs, location]);
    this.arguments = args;
    this.byref = byref;
    this.type = type;
    this.nullable = nullable;
    this.body = null;
    this.attrGroups = [];
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$f = statement;
const KIND$10 = "global";

/**
 * Imports a variable from the global scope
 * @constructor Global
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Variable[]} items
 */
var global$1 = Statement$f.extends(
  KIND$10,
  function Global(items, docs, location) {
    Statement$f.apply(this, [KIND$10, docs, location]);
    this.items = items;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$e = statement;
const KIND$$ = "goto";

/**
 * Defines goto statement
 * @constructor Goto
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {string} label
 * @see {Label}
 */
var goto = Statement$e.extends(KIND$$, function Goto(label, docs, location) {
  Statement$e.apply(this, [KIND$$, docs, location]);
  this.label = label;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$d = statement;
const KIND$_ = "halt";

/**
 * Halts the compiler execution
 * @constructor Halt
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {String} after - String after the halt statement
 * @see http://php.net/manual/en/function.halt-compiler.php
 */
var halt = Statement$d.extends(KIND$_, function Halt(after, docs, location) {
  Statement$d.apply(this, [KIND$_, docs, location]);
  this.after = after;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$8 = node;
const KIND$Z = "identifier";

/**
 * Defines an identifier node
 * @constructor Identifier
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {string} name
 */
const Identifier = Node$8.extends(
  KIND$Z,
  function Identifier(name, docs, location) {
    Node$8.apply(this, [KIND$Z, docs, location]);
    this.name = name;
  }
);

var identifier = Identifier;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$c = statement;
const KIND$Y = "if";

/**
 * Defines a if statement
 * @constructor If
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression} test
 * @property {Block} body
 * @property {Block|If|null} alternate
 * @property {boolean} shortForm
 */
var _if = Statement$c.extends(
  KIND$Y,
  function If(test, body, alternate, shortForm, docs, location) {
    Statement$c.apply(this, [KIND$Y, docs, location]);
    this.test = test;
    this.body = body;
    this.alternate = alternate;
    this.shortForm = shortForm;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$d = expression;
const KIND$X = "include";

/**
 * Defines system include call
 * @constructor Include
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Node} target
 * @property {boolean} once
 * @property {boolean} require
 */
var include = Expression$d.extends(
  KIND$X,
  function Include(once, require, target, docs, location) {
    Expression$d.apply(this, [KIND$X, docs, location]);
    this.once = once;
    this.require = require;
    this.target = target;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Literal$4 = literal;
const KIND$W = "inline";

/**
 * Defines inline html output (treated as echo output)
 * @constructor Inline
 * @memberOf module:php-parser
 * @extends {Literal}
 * @property {string} value
 */
var inline = Literal$4.extends(
  KIND$W,
  function Inline(value, raw, docs, location) {
    Literal$4.apply(this, [KIND$W, value, raw, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration$4 = declaration;
const KIND$V = "interface";

/**
 * An interface definition
 * @constructor Interface
 * @memberOf module:php-parser
 * @extends {Declaration}
 * @property {Identifier[]} extends
 * @property {Declaration[]} body
 * @property {AttrGroup[]} attrGroups
 */
var _interface = Declaration$4.extends(
  KIND$V,
  function Interface(name, ext, body, attrGroups, docs, location) {
    Declaration$4.apply(this, [KIND$V, name, docs, location]);
    this.extends = ext;
    this.body = body;
    this.attrGroups = attrGroups;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration$3 = declaration;
const KIND$U = "intersectiontype";

/**
 * A union of types
 * @memberOf module:php-parser
 * @constructor IntersectionType
 * @extends {Declaration}
 * @property {TypeReference[]} types
 */
var intersectiontype = Declaration$3.extends(
  KIND$U,
  function IntersectionType(types, docs, location) {
    Declaration$3.apply(this, [KIND$U, null, docs, location]);
    this.types = types;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$c = expression;
const KIND$T = "isset";

/**
 * Defines an isset call
 * @constructor Isset
 * @memberOf module:php-parser
 * @extends {Expression}
 */
var isset = Expression$c.extends(
  KIND$T,
  function Isset(variables, docs, location) {
    Expression$c.apply(this, [KIND$T, docs, location]);
    this.variables = variables;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$b = statement;
const KIND$S = "label";

/**
 * A label statement (referenced by goto)
 * @constructor Label
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {String} name
 */
var label = Statement$b.extends(KIND$S, function Label(name, docs, location) {
  Statement$b.apply(this, [KIND$S, docs, location]);
  this.name = name;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$b = expression;
const KIND$R = "list";

/**
 * Defines list assignment
 * @constructor List
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {boolean} shortForm
 * @property {Entry[]} items
 */
var list = Expression$b.extends(
  KIND$R,
  function List(items, shortForm, docs, location) {
    Expression$b.apply(this, [KIND$R, docs, location]);
    this.items = items;
    this.shortForm = shortForm;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expr = expression;
const KIND$Q = "lookup";

/**
 * Lookup on an offset in the specified object
 * @constructor Lookup
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} what
 * @property {Expression} offset
 */
var lookup = Expr.extends(
  KIND$Q,
  function Lookup(kind, what, offset, docs, location) {
    Expr.apply(this, [kind || KIND$Q, docs, location]);
    this.what = what;
    this.offset = offset;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Literal$3 = literal;
const KIND$P = "magic";

/**
 * Defines magic constant
 * @constructor Magic
 * @memberOf module:php-parser
 * @extends {Literal}
 */
var magic = Literal$3.extends(
  KIND$P,
  function Magic(value, raw, docs, location) {
    Literal$3.apply(this, [KIND$P, value, raw, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$a = expression;
const KIND$O = "match";

/**
 * Defines a match expression
 * @memberOf module:php-parser
 * @constructor Match
 * @extends {Expression}
 * @property {Expression} cond Condition expression to match against
 * @property {MatchArm[]} arms Arms for comparison
 */
var match = Expression$a.extends(
  KIND$O,
  function Match(cond, arms, docs, location) {
    Expression$a.apply(this, [KIND$O, docs, location]);
    this.cond = cond;
    this.arms = arms;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$9 = expression;
const KIND$N = "matcharm";

/**
 * An array entry - see [Array](#array)
 * @memberOf module:php-parser
 * @constructor MatchArm
 * @extends {Expression}
 * @property {Expression[]|null} conds The match condition expression list - null indicates default arm
 * @property {Expression} body The return value expression
 */
var matcharm = Expression$9.extends(
  KIND$N,
  function MatchArm(conds, body, docs, location) {
    Expression$9.apply(this, [KIND$N, docs, location]);
    this.conds = conds;
    this.body = body;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Function_ = _function;
const KIND$M = "method";

/**
 * Defines a class/interface/trait method
 * @constructor Method
 * @memberOf module:php-parser
 * @extends {Function}
 * @property {boolean} isAbstract
 * @property {boolean} isFinal
 * @property {boolean} isStatic
 * @property {string} visibility
 */
var method = Function_.extends(KIND$M, function Method() {
  Function_.apply(this, arguments);
  this.kind = KIND$M;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$7 = node;
const KIND$L = "reference";

/**
 * Defines a reference node
 * @constructor Reference
 * @memberOf module:php-parser
 * @extends {Node}
 */
const Reference$5 = Node$7.extends(KIND$L, function Reference(kind, docs, location) {
  Node$7.apply(this, [kind || KIND$L, docs, location]);
});

var reference = Reference$5;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Reference$4 = reference;
const KIND$K = "name";

/**
 * Defines a class reference node
 * @constructor Name
 * @memberOf module:php-parser
 * @extends {Reference}
 * @property {string} name
 * @property {string} resolution
 */
const Name = Reference$4.extends(
  KIND$K,
  function Name(name, resolution, docs, location) {
    Reference$4.apply(this, [KIND$K, docs, location]);
    this.name = name.replace(/\\$/, "");
    this.resolution = resolution;
  }
);

/**
 * This is an identifier without a namespace separator, such as Foo
 * @constant {String} Name#UNQUALIFIED_NAME
 * @memberOf module:php-parser
 */
Name.UNQUALIFIED_NAME = "uqn";
/**
 * This is an identifier with a namespace separator, such as Foo\Bar
 * @constant {String} Name#QUALIFIED_NAME
 * @memberOf module:php-parser
 */
Name.QUALIFIED_NAME = "qn";
/**
 * This is an identifier with a namespace separator that begins with
 * a namespace separator, such as \Foo\Bar. The namespace \Foo is also
 * a fully qualified name.
 * @constant {String} Name#FULL_QUALIFIED_NAME
 * @memberOf module:php-parser
 */
Name.FULL_QUALIFIED_NAME = "fqn";
/**
 * This is an identifier starting with namespace, such as namespace\Foo\Bar.
 * @constant {String} Name#RELATIVE_NAME
 * @memberOf module:php-parser
 */
Name.RELATIVE_NAME = "rn";

var name = Name;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Block$1 = block;
const KIND$J = "namespace";

/**
 * The main program node
 * @constructor Namespace
 * @memberOf module:php-parser
 * @extends {Block}
 * @property {string} name
 * @property {boolean} withBrackets
 */
var namespace = Block$1.extends(
  KIND$J,
  function Namespace(name, children, withBrackets, docs, location) {
    Block$1.apply(this, [KIND$J, children, docs, location]);
    this.name = name;
    this.withBrackets = withBrackets || false;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$8 = expression;
const KIND$I = "namedargument";

/**
 * Named arguments.
 * @memberOf module:php-parser
 * @constructor namedargument
 * @extends {Expression}
 * @property {String} name
 * @property {Expression} value
 * @see https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments
 */
var namedargument = Expression$8.extends(
  KIND$I,
  function namedargument(name, value, docs, location) {
    Expression$8.apply(this, [KIND$I, docs, location]);
    this.name = name;
    this.value = value;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$7 = expression;
const KIND$H = "new";

/**
 * Creates a new instance of the specified class
 * @constructor New
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Identifier|Variable|Class} what
 * @property {Variable[]} arguments
 */
var _new = Expression$7.extends(
  KIND$H,
  function New(what, args, docs, location) {
    Expression$7.apply(this, [KIND$H, docs, location]);
    this.what = what;
    this.arguments = args;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$6 = node;
const KIND$G = "noop";

/**
 * Ignore this node, it implies a no operation block, for example :
 * [$foo, $bar, /* here a noop node * /]
 * @constructor Noop
 * @memberOf module:php-parser
 * @extends {Node}
 */
var noop = Node$6.extends(KIND$G, function Noop(docs, location) {
  Node$6.apply(this, [KIND$G, docs, location]);
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Literal$2 = literal;
const KIND$F = "nowdoc";

/**
 * Defines a nowdoc string
 * @constructor NowDoc
 * @memberOf module:php-parser
 * @extends {Literal}
 * @property {string} label
 * @property {string} raw
 * @property {string} value
 */
var nowdoc = Literal$2.extends(
  KIND$F,
  function Nowdoc(value, raw, label, docs, location) {
    Literal$2.apply(this, [KIND$F, value, raw, docs, location]);
    this.label = label;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$5 = node;
const KIND$E = "nullkeyword";

/**
 * Represents the null keyword
 * @constructor NullKeyword
 * @memberOf module:php-parser
 * @extends {Node}
 */
var nullkeyword = Node$5.extends(KIND$E, function NullKeyword(raw, docs, location) {
  Node$5.apply(this, [KIND$E, docs, location]);
  this.raw = raw;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Lookup$3 = lookup;
const KIND$D = "nullsafepropertylookup";

/**
 * Lookup to an object property
 * @memberOf module:php-parser
 * @constructor NullSafePropertyLookup
 * @extends {Lookup}
 */
var nullsafepropertylookup = Lookup$3.extends(
  KIND$D,
  function NullSafePropertyLookup(what, offset, docs, location) {
    Lookup$3.apply(this, [KIND$D, what, offset, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Literal$1 = literal;
const KIND$C = "number";

/**
 * Defines a numeric value
 * @constructor Number
 * @memberOf module:php-parser
 * @extends {Literal}
 * @property {number} value
 */
var number = Literal$1.extends(
  KIND$C,
  function Number(value, raw, docs, location) {
    Literal$1.apply(this, [KIND$C, value, raw, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Lookup$2 = lookup;
const KIND$B = "offsetlookup";

/**
 * Lookup on an offset in an array
 * @constructor OffsetLookup
 * @memberOf module:php-parser
 * @extends {Lookup}
 */
var offsetlookup = Lookup$2.extends(
  KIND$B,
  function OffsetLookup(what, offset, docs, location) {
    Lookup$2.apply(this, [KIND$B, what, offset, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration$2 = declaration;
const KIND$A = "parameter";

/**
 * @memberOf module:php-parser
 * @typedef {1} MODIFIER_PUBLIC
 **/
/**
 * @memberOf module:php-parser
 * @typedef {2} MODIFIER_PROTECTED
 **/
/**
 * @memberOf module:php-parser
 * @typedef {4} MODIFIER_PRIVATE
 **/
/**
 * Defines a function parameter
 * @constructor Parameter
 * @memberOf module:php-parser
 * @extends {Declaration}
 * @property {Identifier|null} type
 * @property {Node|null} value
 * @property {boolean} byref
 * @property {boolean} variadic
 * @property {boolean} readonly
 * @property {boolean} nullable
 * @property {AttrGroup[]} attrGroups
 * @property {MODIFIER_PUBLIC|MODIFIER_PROTECTED|MODIFIER_PRIVATE} flags
 */
var parameter = Declaration$2.extends(
  KIND$A,
  function Parameter(
    name,
    type,
    value,
    isRef,
    isVariadic,
    readonly,
    nullable,
    flags,
    docs,
    location
  ) {
    Declaration$2.apply(this, [KIND$A, name, docs, location]);
    this.value = value;
    this.type = type;
    this.byref = isRef;
    this.variadic = isVariadic;
    this.readonly = readonly;
    this.nullable = nullable;
    this.flags = flags || 0;
    this.attrGroups = [];
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Reference$3 = reference;
const KIND$z = "parentreference";

/**
 * Defines a class reference node
 * @constructor ParentReference
 * @memberOf module:php-parser
 * @extends {Reference}
 */
const ParentReference = Reference$3.extends(
  KIND$z,
  function ParentReference(raw, docs, location) {
    Reference$3.apply(this, [KIND$z, docs, location]);
    this.raw = raw;
  }
);
var parentreference = ParentReference;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Operation$2 = operation;
const KIND$y = "post";

/**
 * Defines a post operation `$i++` or `$i--`
 * @constructor Post
 * @memberOf module:php-parser
 * @extends {Operation}
 * @property {String} type
 * @property {Variable} what
 */
var post = Operation$2.extends(
  KIND$y,
  function Post(type, what, docs, location) {
    Operation$2.apply(this, [KIND$y, docs, location]);
    this.type = type;
    this.what = what;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Operation$1 = operation;
const KIND$x = "pre";

/**
 * Defines a pre operation `++$i` or `--$i`
 * @constructor Pre
 * @memberOf module:php-parser
 * @extends {Operation}
 * @property {String} type
 * @property {Variable} what
 */
var pre = Operation$1.extends(
  KIND$x,
  function Pre(type, what, docs, location) {
    Operation$1.apply(this, [KIND$x, docs, location]);
    this.type = type;
    this.what = what;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$6 = expression;
const KIND$w = "print";

/**
 * Outputs
 * @constructor Print
 * @memberOf module:php-parser
 * @extends {Expression}
 */
var print = Expression$6.extends(
  KIND$w,
  function Print(expression, docs, location) {
    Expression$6.apply(this, [KIND$w, docs, location]);
    this.expression = expression;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Block = block;
const KIND$v = "program";

/**
 * The main program node
 * @constructor Program
 * @memberOf module:php-parser
 * @extends {Block}
 * @property {Error[]} errors
 * @property {Comment[]|null} comments
 * @property {String[]|null} tokens
 */
var program = Block.extends(
  KIND$v,
  function Program(children, errors, comments, tokens, docs, location) {
    Block.apply(this, [KIND$v, children, docs, location]);
    this.errors = errors;
    if (comments) {
      this.comments = comments;
    }
    if (tokens) {
      this.tokens = tokens;
    }
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$a = statement;
const KIND$u = "property";

/**
 * Defines a class property
 * @constructor Property
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {string} name
 * @property {Node|null} value
 * @property {boolean} readonly
 * @property {boolean} nullable
 * @property {Identifier|Array<Identifier>|null} type
 * @property {AttrGroup[]} attrGroups
 */
var property = Statement$a.extends(
  KIND$u,
  function Property(
    name,
    value,
    readonly,
    nullable,
    type,
    attrGroups,
    docs,
    location
  ) {
    Statement$a.apply(this, [KIND$u, docs, location]);
    this.name = name;
    this.value = value;
    this.readonly = readonly;
    this.nullable = nullable;
    this.type = type;
    this.attrGroups = attrGroups;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Lookup$1 = lookup;
const KIND$t = "propertylookup";

/**
 * Lookup to an object property
 * @memberOf module:php-parser
 * @constructor PropertyLookup
 * @extends {Lookup}
 */
var propertylookup = Lookup$1.extends(
  KIND$t,
  function PropertyLookup(what, offset, docs, location) {
    Lookup$1.apply(this, [KIND$t, what, offset, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$9 = statement;
const KIND$s = "propertystatement";

const IS_UNDEFINED$1 = "";
const IS_PUBLIC$1 = "public";
const IS_PROTECTED$1 = "protected";
const IS_PRIVATE$1 = "private";

/**
 * Declares a properties into the current scope
 * @constructor PropertyStatement
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Property[]} properties
 * @property {string|null} visibility
 * @property {boolean} isStatic
 */
const PropertyStatement = Statement$9.extends(
  KIND$s,
  function PropertyStatement(kind, properties, flags, docs, location) {
    Statement$9.apply(this, [KIND$s, docs, location]);
    this.properties = properties;
    this.parseFlags(flags);
  }
);

/**
 * Generic flags parser
 * @function PropertyStatement#parseFlags
 * @memberOf module:php-parser
 * @param {Array<number|null>} flags
 * @return {void}
 */
PropertyStatement.prototype.parseFlags = function (flags) {
  if (flags[0] === -1) {
    this.visibility = IS_UNDEFINED$1;
  } else if (flags[0] === null) {
    this.visibility = null;
  } else if (flags[0] === 0) {
    this.visibility = IS_PUBLIC$1;
  } else if (flags[0] === 1) {
    this.visibility = IS_PROTECTED$1;
  } else if (flags[0] === 2) {
    this.visibility = IS_PRIVATE$1;
  }

  this.isStatic = flags[1] === 1;
};

var propertystatement = PropertyStatement;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$5 = expression;
const KIND$r = "retif";

/**
 * Defines a short if statement that returns a value
 * @constructor RetIf
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} test
 * @property {Expression} trueExpr
 * @property {Expression} falseExpr
 */
var retif = Expression$5.extends(
  KIND$r,
  function RetIf(test, trueExpr, falseExpr, docs, location) {
    Expression$5.apply(this, [KIND$r, docs, location]);
    this.test = test;
    this.trueExpr = trueExpr;
    this.falseExpr = falseExpr;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$8 = statement;
const KIND$q = "return";

/**
 * A continue statement
 * @constructor Return
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression|null} expr
 */
var _return = Statement$8.extends(KIND$q, function Return(expr, docs, location) {
  Statement$8.apply(this, [KIND$q, docs, location]);
  this.expr = expr;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Reference$2 = reference;
const KIND$p = "selfreference";

/**
 * Defines a class reference node
 * @constructor SelfReference
 * @memberOf module:php-parser
 * @extends {Reference}
 */
const SelfReference = Reference$2.extends(
  KIND$p,
  function SelfReference(raw, docs, location) {
    Reference$2.apply(this, [KIND$p, docs, location]);
    this.raw = raw;
  }
);
var selfreference = SelfReference;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$4 = expression;
const KIND$o = "silent";

/**
 * Avoids to show/log warnings & notices from the inner expression
 * @constructor Silent
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} expr
 */
var silent = Expression$4.extends(
  KIND$o,
  function Silent(expr, docs, location) {
    Expression$4.apply(this, [KIND$o, docs, location]);
    this.expr = expr;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$7 = statement;
const KIND$n = "static";

/**
 * Declares a static variable into the current scope
 * @constructor Static
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {StaticVariable[]} variables
 */
var _static = Statement$7.extends(
  KIND$n,
  function Static(variables, docs, location) {
    Statement$7.apply(this, [KIND$n, docs, location]);
    this.variables = variables;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$4 = node;
const KIND$m = "staticvariable";

/**
 * Defines a constant
 * @constructor StaticVariable
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {Variable} variable
 * @property {Node|string|number|boolean|null} defaultValue
 */
var staticvariable = Node$4.extends(
  KIND$m,
  function StaticVariable(variable, defaultValue, docs, location) {
    Node$4.apply(this, [KIND$m, docs, location]);
    this.variable = variable;
    this.defaultValue = defaultValue;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Lookup = lookup;
const KIND$l = "staticlookup";

/**
 * Lookup to a static property
 * @constructor StaticLookup
 * @memberOf module:php-parser
 * @extends {Lookup}
 */
var staticlookup = Lookup.extends(
  KIND$l,
  function StaticLookup(what, offset, docs, location) {
    Lookup.apply(this, [KIND$l, what, offset, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Reference$1 = reference;
const KIND$k = "staticreference";

/**
 * Defines a class reference node
 * @constructor StaticReference
 * @memberOf module:php-parser
 * @extends {Reference}
 */
const StaticReference = Reference$1.extends(
  KIND$k,
  function StaticReference(raw, docs, location) {
    Reference$1.apply(this, [KIND$k, docs, location]);
    this.raw = raw;
  }
);
var staticreference = StaticReference;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Literal = literal;
const KIND$j = "string";

/**
 * Defines a string (simple or double quoted) - chars are already escaped
 * @constructor String
 * @memberOf module:php-parser
 * @extends {Literal}
 * @property {boolean} unicode
 * @property {boolean} isDoubleQuote
 * @see {Encapsed}
 * @property {string} value
 */
var string = Literal.extends(
  KIND$j,
  function String(isDoubleQuote, value, unicode, raw, docs, location) {
    Literal.apply(this, [KIND$j, value, raw, docs, location]);
    this.unicode = unicode;
    this.isDoubleQuote = isDoubleQuote;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$6 = statement;
const KIND$i = "switch";

/**
 * Defines a switch statement
 * @constructor Switch
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression} test
 * @property {Block} body
 * @property {boolean} shortForm
 */
var _switch = Statement$6.extends(
  KIND$i,
  function Switch(test, body, shortForm, docs, location) {
    Statement$6.apply(this, [KIND$i, docs, location]);
    this.test = test;
    this.body = body;
    this.shortForm = shortForm;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$5 = statement;
const KIND$h = "throw";

/**
 * Defines a throw statement
 * @constructor Throw
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression} what
 */
var _throw = Statement$5.extends(KIND$h, function Throw(what, docs, location) {
  Statement$5.apply(this, [KIND$h, docs, location]);
  this.what = what;
});

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration$1 = declaration;
const KIND$g = "trait";

/**
 * A trait definition
 * @constructor Trait
 * @memberOf module:php-parser
 * @extends {Declaration}
 * @property {Declaration[]} body
 */
var trait = Declaration$1.extends(
  KIND$g,
  function Trait(name, body, docs, location) {
    Declaration$1.apply(this, [KIND$g, name, docs, location]);
    this.body = body;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$3 = node;
const KIND$f = "traitalias";

const IS_UNDEFINED = "";
const IS_PUBLIC = "public";
const IS_PROTECTED = "protected";
const IS_PRIVATE = "private";

/**
 * Defines a trait alias
 * @constructor TraitAlias
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {Identifier|null} trait
 * @property {Identifier} method
 * @property {Identifier|null} as
 * @property {string|null} visibility
 */
var traitalias = Node$3.extends(
  KIND$f,
  function TraitAlias(trait, method, as, flags, docs, location) {
    Node$3.apply(this, [KIND$f, docs, location]);
    this.trait = trait;
    this.method = method;
    this.as = as;
    this.visibility = IS_UNDEFINED;
    if (flags) {
      if (flags[0] === 0) {
        this.visibility = IS_PUBLIC;
      } else if (flags[0] === 1) {
        this.visibility = IS_PROTECTED;
      } else if (flags[0] === 2) {
        this.visibility = IS_PRIVATE;
      }
    }
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$2 = node;
const KIND$e = "traitprecedence";

/**
 * Defines a trait alias
 * @constructor TraitPrecedence
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {Identifier|null} trait
 * @property {Identifier} method
 * @property {Identifier[]} instead
 */
var traitprecedence = Node$2.extends(
  KIND$e,
  function TraitPrecedence(trait, method, instead, docs, location) {
    Node$2.apply(this, [KIND$e, docs, location]);
    this.trait = trait;
    this.method = method;
    this.instead = instead;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node$1 = node;
const KIND$d = "traituse";

/**
 * Defines a trait usage
 * @constructor TraitUse
 * @memberOf module:php-parser
 * @extends {Node}
 * @property {Identifier[]} traits
 * @property {Node[]|null} adaptations
 */
var traituse = Node$1.extends(
  KIND$d,
  function TraitUse(traits, adaptations, docs, location) {
    Node$1.apply(this, [KIND$d, docs, location]);
    this.traits = traits;
    this.adaptations = adaptations;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$4 = statement;
const KIND$c = "try";

/**
 * Defines a try statement
 * @constructor Try
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Block} body
 * @property {Catch[]} catches
 * @property {Block} always
 */
var _try = Statement$4.extends(
  KIND$c,
  function Try(body, catches, always, docs, location) {
    Statement$4.apply(this, [KIND$c, docs, location]);
    this.body = body;
    this.catches = catches;
    this.always = always;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Reference = reference;
const KIND$b = "typereference";

/**
 * Defines a class reference node
 * @constructor TypeReference
 * @memberOf module:php-parser
 * @extends {Reference}
 * @property {string} name
 */
const TypeReference = Reference.extends(
  KIND$b,
  function TypeReference(name, raw, docs, location) {
    Reference.apply(this, [KIND$b, docs, location]);
    this.name = name;
    this.raw = raw;
  }
);

TypeReference.types = [
  "int",
  "float",
  "string",
  "bool",
  "object",
  "array",
  "callable",
  "iterable",
  "void",
  "static",
];

var typereference = TypeReference;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Operation = operation;
const KIND$a = "unary";

/**
 * Unary operations
 * @constructor Unary
 * @memberOf module:php-parser
 * @extends {Operation}
 * @property {string} type
 * @property {Expression} what
 */
var unary = Operation.extends(
  KIND$a,
  function Unary(type, what, docs, location) {
    Operation.apply(this, [KIND$a, docs, location]);
    this.type = type;
    this.what = what;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Declaration = declaration;
const KIND$9 = "uniontype";

/**
 * A union of types
 * @memberOf module:php-parser
 * @constructor UnionType
 * @extends {Declaration}
 * @property {TypeReference[]} types
 */
var uniontype = Declaration.extends(
  KIND$9,
  function UnionType(types, docs, location) {
    Declaration.apply(this, [KIND$9, null, docs, location]);
    this.types = types;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$3 = statement;
const KIND$8 = "unset";

/**
 * Deletes references to a list of variables
 * @constructor Unset
 * @memberOf module:php-parser
 * @extends {Statement}
 */
var unset = Statement$3.extends(
  KIND$8,
  function Unset(variables, docs, location) {
    Statement$3.apply(this, [KIND$8, docs, location]);
    this.variables = variables;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$2 = statement;
const KIND$7 = "usegroup";

/**
 * Defines a use statement (with a list of use items)
 * @constructor UseGroup
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {string|null} name
 * @property {string|null} type - Possible value : function, const
 * @property {UseItem[]} item
 * @see {Namespace}
 * @see http://php.net/manual/en/language.namespaces.importing.php
 */
var usegroup = Statement$2.extends(
  KIND$7,
  function UseGroup(name, type, items, docs, location) {
    Statement$2.apply(this, [KIND$7, docs, location]);
    this.name = name;
    this.type = type;
    this.items = items;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement$1 = statement;
const KIND$6 = "useitem";

/**
 * Defines a use statement (from namespace)
 * @constructor UseItem
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {string} name
 * @property {string|null} type - Possible value : function, const
 * @property {Identifier|null} alias
 * @see {Namespace}
 * @see http://php.net/manual/en/language.namespaces.importing.php
 */
const UseItem = Statement$1.extends(
  KIND$6,
  function UseItem(name, alias, type, docs, location) {
    Statement$1.apply(this, [KIND$6, docs, location]);
    this.name = name;
    this.alias = alias;
    this.type = type;
  }
);

/**
 * Importing a constant
 * @constant {string} UseItem#TYPE_CONST
 * @memberOf module:php-parser
 */
UseItem.TYPE_CONST = "const";
/**
 * Importing a function
 * @constant {string} UseItem#TYPE_FUNC
 * @memberOf module:php-parser
 */
UseItem.TYPE_FUNCTION = "function";

var useitem = UseItem;

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$3 = expression;
const KIND$5 = "variable";

/**
 * Any expression node. Since the left-hand side of an assignment may
 * be any expression in general, an expression can also be a pattern.
 * @constructor Variable
 * @memberOf module:php-parser
 * @extends {Expression}
 * @example
 * // PHP code :
 * $foo
 * // AST output
 * {
 *  "kind": "variable",
 *  "name": "foo",
 *  "curly": false
 * }
 * @property {string|Node} name The variable name (can be a complex expression when the name is resolved dynamically)
 * @property {boolean} curly Indicate if the name is defined between curlies, ex `${foo}`
 */
var variable = Expression$3.extends(
  KIND$5,
  function Variable(name, curly, docs, location) {
    Expression$3.apply(this, [KIND$5, docs, location]);
    this.name = name;
    this.curly = curly || false;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$2 = expression;
const KIND$4 = "variadic";

/**
 * Introduce a list of items into the arguments of the call
 * @constructor Variadic
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Array|Expression} what
 * @see https://wiki.php.net/rfc/argument_unpacking
 */
var variadic = Expression$2.extends(
  KIND$4,
  function variadic(what, docs, location) {
    Expression$2.apply(this, [KIND$4, docs, location]);
    this.what = what;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Node = node;
const KIND$3 = "variadicplaceholder";

/**
 * Defines a variadic placeholder (the ellipsis in PHP 8.1+'s first-class callable syntax)
 * @constructor VariadicPlaceholder
 * @memberOf module:php-parser
 * @extends {Node}
 * @see {Namespace}
 * @see http://php.net/manual/en/language.namespaces.importing.php
 */
var variadicplaceholder = Node.extends(
  KIND$3,
  function VariadicPlaceholder(docs, location) {
    Node.apply(this, [KIND$3, docs, location]);
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Statement = statement;
const KIND$2 = "while";

/**
 * Defines a while statement
 * @constructor While
 * @memberOf module:php-parser
 * @extends {Statement}
 * @property {Expression} test
 * @property {Block | null} body
 * @property {boolean} shortForm
 */
var _while = Statement.extends(
  KIND$2,
  function While(test, body, shortForm, docs, location) {
    Statement.apply(this, [KIND$2, docs, location]);
    this.test = test;
    this.body = body;
    this.shortForm = shortForm;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression$1 = expression;
const KIND$1 = "yield";

/**
 * Defines a yield generator statement
 * @constructor Yield
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression|null} value
 * @property {Expression|null} key
 * @see http://php.net/manual/en/language.generators.syntax.php
 */
var _yield = Expression$1.extends(
  KIND$1,
  function Yield(value, key, docs, location) {
    Expression$1.apply(this, [KIND$1, docs, location]);
    this.value = value;
    this.key = key;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Expression = expression;
const KIND = "yieldfrom";

/**
 * Defines a yield from generator statement
 * @constructor YieldFrom
 * @memberOf module:php-parser
 * @extends {Expression}
 * @property {Expression} value
 * @see http://php.net/manual/en/language.generators.syntax.php
 */
var yieldfrom = Expression.extends(
  KIND,
  function YieldFrom(value, docs, location) {
    Expression.apply(this, [KIND, docs, location]);
    this.value = value;
  }
);

/**
 * Copyright (C) 2018 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const Location = location;
const Position = position;

/**
 * ## Class hierarchy
 *
 * - [Location](#location)
 * - [Position](#position)
 * - [Node](#node)
 *   - [Noop](#noop)
 *   - [NullKeyword](#nullkeyword)
 *   - [StaticVariable](#staticvariable)
 *   - [EncapsedPart](#encapsedpart)
 *   - [Constant](#constant)
 *   - [Identifier](#identifier)
 *   - [Reference](#reference)
 *     - [TypeReference](#typereference)
 *     - [ParentReference](#parentreference)
 *     - [StaticReference](#staticreference)
 *     - [SelfReference](#selfreference)
 *     - [Name](#name)
 *   - [TraitUse](#traituse)
 *   - [TraitAlias](#traitalias)
 *   - [TraitPrecedence](#traitprecedence)
 *   - [Comment](#comment)
 *     - [CommentLine](#commentline)
 *     - [CommentBlock](#commentblock)
 *   - [Error](#error)
 *   - [Expression](#expression)
 *     - [Entry](#entry)
 *     - [ArrowFunc](#arrowfunc)
 *     - [Closure](#closure)
 *     - [ByRef](#byref)
 *     - [Silent](#silent)
 *     - [RetIf](#retif)
 *     - [New](#new)
 *     - [Include](#include)
 *     - [Call](#call)
 *     - [Eval](#eval)
 *     - [Exit](#exit)
 *     - [Clone](#clone)
 *     - [Assign](#assign)
 *     - [AssignRef](#assignref)
 *     - [Array](#array)
 *     - [List](#list)
 *     - [Variable](#variable)
 *     - [Variadic](#variadic)
 *     - [Yield](#yield)
 *     - [YieldFrom](#yieldfrom)
 *     - [Print](#print)
 *     - [Isset](#isset)
 *     - [Empty](#empty)
 *     - [Lookup](#lookup)
 *       - [PropertyLookup](#propertylookup)
 *       - [StaticLookup](#staticlookup)
 *       - [OffsetLookup](#offsetlookup)
 *     - [Operation](#operation)
 *       - [Pre](#pre)
 *       - [Post](#post)
 *       - [Bin](#bin)
 *       - [Unary](#unary)
 *       - [Cast](#cast)
 *     - [Literal](#literal)
 *       - [Boolean](#boolean)
 *       - [String](#string)
 *       - [Number](#number)
 *       - [Inline](#inline)
 *       - [Magic](#magic)
 *       - [Nowdoc](#nowdoc)
 *       - [Encapsed](#encapsed)
 *   - [Statement](#statement)
 *     - [ConstantStatement](#constantstatement)
 *       - [ClassConstant](#classconstant)
 *     - [Return](#return)
 *     - [Label](#label)
 *     - [Continue](#continue)
 *     - [Case](#case)
 *     - [Break](#break)
 *     - [Echo](#echo)
 *     - [Unset](#unset)
 *     - [Halt](#halt)
 *     - [Declare](#declare)
 *     - [Global](#global)
 *     - [Static](#static)
 *     - [If](#if)
 *     - [Do](#do)
 *     - [While](#while)
 *     - [For](#for)
 *     - [Foreach](#foreach)
 *     - [Switch](#switch)
 *     - [Goto](#goto)
 *     - [Try](#try)
 *     - [Catch](#catch)
 *     - [Throw](#throw)
 *     - [UseGroup](#usegroup)
 *     - [UseItem](#useitem)
 *     - [Block](#block)
 *       - [Program](#program)
 *       - [Namespace](#namespace)
 *     - [PropertyStatement](#propertystatement)
 *     - [Property](#property)
 *     - [Declaration](#declaration)
 *       - [Class](#class)
 *       - [Interface](#interface)
 *       - [Trait](#trait)
 *       - [Function](#function)
 *         - [Method](#method)
 *       - [Parameter](#parameter)
 * ---
 */

/**
 * The AST builder class
 * @constructor AST
 * @memberOf module:php-parser
 * @tutorial AST
 * @property {Boolean} withPositions - Should locate any node (by default false)
 * @property {Boolean} withSource - Should extract the node original code (by default false)
 */
const AST$1 = function (withPositions, withSource) {
  this.withPositions = withPositions;
  this.withSource = withSource;
};

// operators in ascending order of precedence
AST$1.precedence = {};
[
  ["or"],
  ["xor"],
  ["and"],
  ["="],
  ["?"],
  ["??"],
  ["||"],
  ["&&"],
  ["|"],
  ["^"],
  ["&"],
  ["==", "!=", "===", "!==", /* '<>', */ "<=>"],
  ["<", "<=", ">", ">="],
  ["<<", ">>"],
  ["+", "-", "."],
  ["*", "/", "%"],
  ["!"],
  ["instanceof"],
  ["cast", "silent"],
  ["**"],
  // TODO: [ (array)
  // TODO: clone, new
].forEach(function (list, index) {
  list.forEach(function (operator) {
    AST$1.precedence[operator] = index + 1;
  });
});

/**
 * @private
 * @function AST#isRightAssociative
 * @memberOf module:php-parser
 * @param operator
 * @return {boolean}
 */
AST$1.prototype.isRightAssociative = function (operator) {
  return operator === "**" || operator === "??";
};

/**
 * Change parent node informations after swapping childs
 * @private
 * @function AST#swapLocations
 * @memberOf module:php-parser
 */
AST$1.prototype.swapLocations = function (target, first, last, parser) {
  if (this.withPositions) {
    target.loc.start = first.loc.start;
    target.loc.end = last.loc.end;
    if (this.withSource) {
      target.loc.source = parser.lexer._input.substring(
        target.loc.start.offset,
        target.loc.end.offset
      );
    }
  }
};

/**
 * Includes locations from first & last into the target
 * @private
 * @function AST#resolveLocations
 * @memberOf module:php-parser
 */
AST$1.prototype.resolveLocations = function (target, first, last, parser) {
  if (this.withPositions) {
    if (target.loc.start.offset > first.loc.start.offset) {
      target.loc.start = first.loc.start;
    }
    /* istanbul ignore next */
    if (target.loc.end.offset < last.loc.end.offset) {
      target.loc.end = last.loc.end;
    }
    if (this.withSource) {
      target.loc.source = parser.lexer._input.substring(
        target.loc.start.offset,
        target.loc.end.offset
      );
    }
  }
};

/**
 * Check and fix precence, by default using right
 * @private
 * @function AST#resolvePrecedence
 * @memberOf module:php-parser
 */
AST$1.prototype.resolvePrecedence = function (result, parser) {
  let buffer, lLevel, rLevel;
  // handling precendence
  if (result.kind === "call") {
    // including what argument into location
    this.resolveLocations(result, result.what, result, parser);
  } else if (
    result.kind === "propertylookup" ||
    result.kind === "staticlookup" ||
    (result.kind === "offsetlookup" && result.offset)
  ) {
    // including what argument into location
    this.resolveLocations(result, result.what, result.offset, parser);
  } else if (result.kind === "bin") {
    if (result.right && !result.right.parenthesizedExpression) {
      if (result.right.kind === "bin") {
        lLevel = AST$1.precedence[result.type];
        rLevel = AST$1.precedence[result.right.type];
        if (
          lLevel &&
          rLevel &&
          rLevel <= lLevel &&
          (result.type !== result.right.type ||
            !this.isRightAssociative(result.type))
        ) {
          // https://github.com/glayzzle/php-parser/issues/79
          // shift precedence
          buffer = result.right;
          result.right = result.right.left;
          this.swapLocations(result, result.left, result.right, parser);
          buffer.left = this.resolvePrecedence(result, parser);
          this.swapLocations(buffer, buffer.left, buffer.right, parser);
          result = buffer;
        }
      } else if (result.right.kind === "retif") {
        lLevel = AST$1.precedence[result.type];
        rLevel = AST$1.precedence["?"];
        if (lLevel && rLevel && rLevel <= lLevel) {
          buffer = result.right;
          result.right = result.right.test;
          this.swapLocations(result, result.left, result.right, parser);
          buffer.test = this.resolvePrecedence(result, parser);
          this.swapLocations(buffer, buffer.test, buffer.falseExpr, parser);
          result = buffer;
        }
      }
    }
  } else if (
    (result.kind === "silent" || result.kind === "cast") &&
    result.expr &&
    !result.expr.parenthesizedExpression
  ) {
    // https://github.com/glayzzle/php-parser/issues/172
    if (result.expr.kind === "bin") {
      buffer = result.expr;
      result.expr = result.expr.left;
      this.swapLocations(result, result, result.expr, parser);
      buffer.left = this.resolvePrecedence(result, parser);
      this.swapLocations(buffer, buffer.left, buffer.right, parser);
      result = buffer;
    } else if (result.expr.kind === "retif") {
      buffer = result.expr;
      result.expr = result.expr.test;
      this.swapLocations(result, result, result.expr, parser);
      buffer.test = this.resolvePrecedence(result, parser);
      this.swapLocations(buffer, buffer.test, buffer.falseExpr, parser);
      result = buffer;
    }
  } else if (result.kind === "unary") {
    // https://github.com/glayzzle/php-parser/issues/75
    if (result.what && !result.what.parenthesizedExpression) {
      // unary precedence is always lower
      if (result.what.kind === "bin") {
        buffer = result.what;
        result.what = result.what.left;
        this.swapLocations(result, result, result.what, parser);
        buffer.left = this.resolvePrecedence(result, parser);
        this.swapLocations(buffer, buffer.left, buffer.right, parser);
        result = buffer;
      } else if (result.what.kind === "retif") {
        buffer = result.what;
        result.what = result.what.test;
        this.swapLocations(result, result, result.what, parser);
        buffer.test = this.resolvePrecedence(result, parser);
        this.swapLocations(buffer, buffer.test, buffer.falseExpr, parser);
        result = buffer;
      }
    }
  } else if (result.kind === "retif") {
    // https://github.com/glayzzle/php-parser/issues/77
    if (
      result.falseExpr &&
      result.falseExpr.kind === "retif" &&
      !result.falseExpr.parenthesizedExpression
    ) {
      buffer = result.falseExpr;
      result.falseExpr = buffer.test;
      this.swapLocations(result, result.test, result.falseExpr, parser);
      buffer.test = this.resolvePrecedence(result, parser);
      this.swapLocations(buffer, buffer.test, buffer.falseExpr, parser);
      result = buffer;
    }
  } else if (result.kind === "assign") {
    // https://github.com/glayzzle/php-parser/issues/81
    if (
      result.right &&
      result.right.kind === "bin" &&
      !result.right.parenthesizedExpression
    ) {
      lLevel = AST$1.precedence["="];
      rLevel = AST$1.precedence[result.right.type];
      // only shifts with and, xor, or
      if (lLevel && rLevel && rLevel < lLevel) {
        buffer = result.right;
        result.right = result.right.left;
        buffer.left = result;
        this.swapLocations(buffer, buffer.left, result.right, parser);
        result = buffer;
      }
    }
  } else if (result.kind === "expressionstatement") {
    this.swapLocations(result, result.expression, result, parser);
  }
  return result;
};

/**
 * Prepares an AST node
 * @private
 * @function AST#prepare
 * @memberOf module:php-parser
 * @param {String|null} kind - Defines the node type
 * @param {*} docs - (if null, the kind must be passed at the function call)
 * @param {Parser} parser - The parser instance (use for extracting locations)
 * @return {Function}
 */
AST$1.prototype.prepare = function (kind, docs, parser) {
  let start = null;
  if (this.withPositions || this.withSource) {
    start = parser.position();
  }
  const self = this;
  // returns the node
  const result = function () {
    let location = null;
    const args = Array.prototype.slice.call(arguments);
    args.push(docs);
    if (self.withPositions || self.withSource) {
      let src = null;
      if (self.withSource) {
        src = parser.lexer._input.substring(start.offset, parser.prev[2]);
      }
      // if with source, need location on swapLocations function
      location = new Location(
        src,
        start,
        new Position(parser.prev[0], parser.prev[1], parser.prev[2])
      );
      // last argument is always the location
      args.push(location);
    }
    // handle lazy kind definitions
    if (!kind) {
      kind = args.shift();
    }
    // build the object
    const node = self[kind];
    if (typeof node !== "function") {
      throw new Error('Undefined node "' + kind + '"');
    }
    const astNode = Object.create(node.prototype);
    node.apply(astNode, args);
    result.instance = astNode;
    /* istanbul ignore next */
    if (result.trailingComments) {
      // buffer of trailingComments
      astNode.trailingComments = result.trailingComments;
    }
    if (typeof result.postBuild === "function") {
      result.postBuild(astNode);
    }
    if (parser.debug) {
      delete self.stack[result.stackUid];
    }
    return self.resolvePrecedence(astNode, parser);
  };
  if (parser.debug) {
    if (!this.stack) {
      this.stack = {};
      this.stackUid = 1;
    }
    this.stack[++this.stackUid] = {
      position: start,
      stack: new Error().stack.split("\n").slice(3, 5),
    };
    result.stackUid = this.stackUid;
  }

  /**
   * Sets a list of trailing comments
   * @private
   * @param {*} docs
   */
  result.setTrailingComments = function (docs) {
    if (result.instance) {
      // already created
      result.instance.setTrailingComments(docs);
    } else {
      result.trailingComments = docs;
    }
  };

  /**
   * Release a node without using it on the AST
   * @private
   * @param {*} target
   */
  result.destroy = function (target) {
    if (docs) {
      // release current docs stack
      if (target) {
        if (!target.leadingComments) {
          target.leadingComments = docs;
        } else {
          target.leadingComments = docs.concat(target.leadingComments);
        }
      } else {
        parser._docIndex = parser._docs.length - docs.length;
      }
    }
    if (parser.debug) {
      delete self.stack[result.stackUid];
    }
  };
  return result;
};

AST$1.prototype.checkNodes = function () {
  const errors = [];
  for (const k in this.stack) {
    if (Object.prototype.hasOwnProperty.call(this.stack, k)) {
      this.stack[k].key = k;
      errors.push(this.stack[k]);
    }
  }
  this.stack = {};
  return errors;
};

// Define all AST nodes
[
  array,
  arrowfunc,
  assign,
  assignref,
  attribute,
  attrgroup,
  bin,
  block,
  boolean,
  _break,
  byref,
  call,
  _case,
  cast,
  _catch,
  _class,
  classconstant,
  clone,
  closure,
  comment,
  commentblock,
  commentline,
  constant,
  constantstatement,
  _continue,
  declaration,
  declare,
  declaredirective,
  _do,
  echo,
  empty,
  encapsed,
  encapsedpart,
  entry,
  _enum,
  enumcase,
  error,
  _eval,
  exit,
  expression,
  expressionstatement,
  _for,
  foreach,
  _function,
  global$1,
  goto,
  halt,
  identifier,
  _if,
  include,
  inline,
  _interface,
  intersectiontype,
  isset,
  label,
  list,
  literal,
  lookup,
  magic,
  match,
  matcharm,
  method,
  name,
  namespace,
  namedargument,
  _new,
  node,
  noop,
  nowdoc,
  nullkeyword,
  nullsafepropertylookup,
  number,
  offsetlookup,
  operation,
  parameter,
  parentreference,
  post,
  pre,
  print,
  program,
  property,
  propertylookup,
  propertystatement,
  reference,
  retif,
  _return,
  selfreference,
  silent,
  statement,
  _static,
  staticvariable,
  staticlookup,
  staticreference,
  string,
  _switch,
  _throw,
  trait,
  traitalias,
  traitprecedence,
  traituse,
  _try,
  typereference,
  unary,
  uniontype,
  unset,
  usegroup,
  useitem,
  variable,
  variadic,
  variadicplaceholder,
  _while,
  _yield,
  yieldfrom,
].forEach(function (ctor) {
  AST$1.prototype[ctor.kind] = ctor;
});

var ast = AST$1;

/**
 * Copyright (C) 2020 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-parser/graphs/contributors
 * @url http://glayzzle.com
 */

const lexer = lexer$1;
const parser = parser$1;
const tokens = tokens_1;
const AST = ast;

/**
 * @private
 */
function combine(src, to) {
  const keys = Object.keys(src);
  let i = keys.length;
  while (i--) {
    const k = keys[i];
    const val = src[k];
    if (val === null) {
      delete to[k];
    } else if (typeof val === "function") {
      to[k] = val.bind(to);
    } else if (Array.isArray(val)) {
      to[k] = Array.isArray(to[k]) ? to[k].concat(val) : val;
    } else if (typeof val === "object") {
      to[k] = typeof to[k] === "object" ? combine(val, to[k]) : val;
    } else {
      to[k] = val;
    }
  }
  return to;
}

/**
 * Initialise a new parser instance with the specified options
 *
 * @class
 * @memberOf module:php-parser
 * @tutorial Engine
 * @example
 * var parser = require('php-parser');
 * var instance = new parser({
 *   parser: {
 *     extractDoc: true,
 *     suppressErrors: true,
 *     version: 704 // or '7.4'
 *   },
 *   ast: {
 *     withPositions: true
 *   },
 *   lexer: {
 *     short_tags: true,
 *     asp_tags: true
 *   }
 * });
 *
 * var evalAST = instance.parseEval('some php code');
 * var codeAST = instance.parseCode('<?php some php code', 'foo.php');
 * var tokens = instance.tokenGetAll('<?php some php code');
 *
 * @param {Object} options - List of options
 * @property {Lexer} lexer
 * @property {Parser} parser
 * @property {AST} ast
 * @property {Object} tokens
 */
const Engine = function (options) {
  if (typeof this === "function") {
    return new this(options);
  }
  this.tokens = tokens;
  this.lexer = new lexer(this);
  this.ast = new AST();
  this.parser = new parser(this.lexer, this.ast);
  if (options && typeof options === "object") {
    // disable php7 from lexer if already disabled from parser
    if (options.parser) {
      if (!options.lexer) {
        options.lexer = {};
      }
      if (options.parser.version) {
        if (typeof options.parser.version === "string") {
          let version = options.parser.version.split(".");
          version = parseInt(version[0]) * 100 + parseInt(version[1]);
          if (isNaN(version)) {
            throw new Error("Bad version number : " + options.parser.version);
          } else {
            options.parser.version = version;
          }
        } else if (typeof options.parser.version !== "number") {
          throw new Error("Expecting a number for version");
        }
        if (options.parser.version < 500 || options.parser.version > 900) {
          throw new Error("Can only handle versions between 5.x to 8.x");
        }
      }
    }
    combine(options, this);

    // same version flags based on parser options
    this.lexer.version = this.parser.version;
  }
};

/**
 * Check if the inpyt is a buffer or a string
 * @private
 * @param  {Buffer|String} buffer Input value that can be either a buffer or a string
 * @return {String}   Returns the string from input
 */
const getStringBuffer = function (buffer) {
  return typeof buffer.write === "function" ? buffer.toString() : buffer;
};

/**
 * Creates a new instance (Helper)
 * @param {Object} options
 * @return {Engine}
 * @private
 */
Engine.create = function (options) {
  return new Engine(options);
};

/**
 * Evaluate the buffer
 * @private
 */
Engine.parseEval = function (buffer, options) {
  const self = new Engine(options);
  return self.parseEval(buffer);
};

/**
 * Parse an evaluating mode string (no need to open php tags)
 * @param {String} buffer
 * @return {Program}
 */
Engine.prototype.parseEval = function (buffer) {
  this.lexer.mode_eval = true;
  this.lexer.all_tokens = false;
  buffer = getStringBuffer(buffer);
  return this.parser.parse(buffer, "eval");
};

/**
 * Static function that parse a php code with open/close tags
 * @private
 */
Engine.parseCode = function (buffer, filename, options) {
  if (typeof filename === "object" && !options) {
    // retro-compatibility
    options = filename;
    filename = "unknown";
  }
  const self = new Engine(options);
  return self.parseCode(buffer, filename);
};

/**
 * Function that parse a php code with open/close tags
 *
 * Sample code :
 * ```php
 * <?php $x = 1;
 * ```
 *
 * Usage :
 * ```js
 * var parser = require('php-parser');
 * var phpParser = new parser({
 *   // some options
 * });
 * var ast = phpParser.parseCode('...php code...', 'foo.php');
 * ```
 * @param {String} buffer - The code to be parsed
 * @param {String} filename - Filename
 * @return {Program}
 */
Engine.prototype.parseCode = function (buffer, filename) {
  this.lexer.mode_eval = false;
  this.lexer.all_tokens = false;
  buffer = getStringBuffer(buffer);
  return this.parser.parse(buffer, filename);
};

/**
 * Split the buffer into tokens
 * @private
 */
Engine.tokenGetAll = function (buffer, options) {
  const self = new Engine(options);
  return self.tokenGetAll(buffer);
};

/**
 * Extract tokens from the specified buffer.
 * > Note that the output tokens are *STRICLY* similar to PHP function `token_get_all`
 * @param {string} buffer
 * @return {Array<string|string[]>} - Each item can be a string or an array with following informations [token_name, text, line_number]
 */
Engine.prototype.tokenGetAll = function (buffer) {
  this.lexer.mode_eval = false;
  this.lexer.all_tokens = true;
  buffer = getStringBuffer(buffer);
  const EOF = this.lexer.EOF;
  const names = this.tokens.values;
  this.lexer.setInput(buffer);
  let token = this.lexer.lex() || EOF;
  const result = [];
  while (token != EOF) {
    let entry = this.lexer.yytext;
    if (Object.prototype.hasOwnProperty.call(names, token)) {
      entry = [names[token], entry, this.lexer.yylloc.first_line];
    }
    result.push(entry);
    token = this.lexer.lex() || EOF;
  }
  return result;
};

/** @module php-parser */

// exports the function
src.exports = Engine;

// makes libraries public
src.exports.tokens = tokens;
src.exports.lexer = lexer;
src.exports.AST = AST;
src.exports.parser = parser;
src.exports.combine = combine;
src.exports.Engine = Engine;

// allow the default export in index.d.ts
src.exports.default = Engine;

var srcExports = src.exports;

const PhpParser = srcExports;

/**
 * Parse a string containing a PHP array into a JS object
 * @param {string} phpString - String containing a PHP array
 * @return {Object} The parsed object.
 */
function fromString (phpString) {
  const parser = new PhpParser({
    parser: {
      extractDoc: false,
      suppressErrors: true
    },
    ast: {
      withPositions: true,
      withSource: true
    }
  });

  phpString = phpString.trim();
  if (phpString.substring(0, 5) !== '<?php') {
    phpString = '<?php \n' + phpString;
  }

  const ast = parser.parseCode(phpString);

  let phpObject = {};
  if (ast.kind === 'program') {
    ast.children.forEach(child => {
      if (child.kind === 'expressionstatement' && child.expression.operator === '=' && child.expression.left.kind === 'variable' && child.expression.right.kind === 'array') {
        phpObject[child.expression.left.name] = parseValue(child.expression.right);
      } else if (child.kind === 'expressionstatement' && child.expression.kind === 'array') {
        phpObject = parseValue(child.expression);
      } else if (child.kind === 'return' && child.expr.kind === 'array') {
        phpObject = parseValue(child.expr);
      }
    });
  }
  return phpObject;
}

/**
 * Parse a PHP expression to JavaScript
 * @private
 * @param  {Object} expr The AST PHP expression.
 * @return {*}           A JavaScript object or value.
 */
function parseValue (expr) {
  if (expr === null) return;
  if (expr.kind === 'array') {
    if (expr.items.length === 0) {
      return [];
    }
    const isKeyed = expr.items.every(item =>
      item === null || item.value === undefined || (item.key !== undefined && item.key !== null)
    );
    let items = expr.items.map(parseValue).filter(itm => itm !== undefined);
    if (isKeyed) {
      items = items.reduce((acc, val) => Object.assign({}, acc, val), {});
    }
    return items;
  }
  if (expr.kind === 'entry') {
    if (expr.key) {
      return {
        [parseKey(expr.key)]: parseValue(expr.value)
      };
    }
    return parseValue(expr.value);
  }
  if (expr.kind === 'string') return expr.value;
  if (expr.kind === 'number') return parseFloat(expr.value);
  if (expr.kind === 'boolean') return expr.value;
  if (expr.kind === 'nullkeyword') return null;
  if (expr.kind === 'identifier' && expr.name.name === 'null') return null;
  if (expr.kind === 'call') return expr.loc?.source;
  return undefined;
}

/**
 * Parse a PHP expression to JavaScript
 * @private
 * @param  {Object} expr The AST PHP expression.
 * @return {*}           A JavaScript object or value.
 */
function parseKey (expr) {
  switch (expr.kind) {
    case 'string':
      return expr.value;
    case 'number':
      return parseFloat(expr.value);
    case 'boolean':
      return expr.value ? 1 : 0;
    default:
      return null;
  }
}

var phpArrayReader = { fromString };

const leerArchivo = async () => {
  try {
    const response = await fetch('/leer-archivo');
    const archivo = await response.text();
    return archivo
  } catch (error) {
    console.error(error);
  }
};

const escribirArchivo = async () => {
  try {
    await fetch('/escribir-archivo', {
      method: 'POST',
      body: JSON.stringify({
        contenido: document.querySelector('#salida').innerText
      })
    });
  } catch (error) {
    console.error(error);
  }
};

document.querySelector('#escribir-archivo').addEventListener('click', () => {
  escribirArchivo();
});

let php = await leerArchivo();

if (!php) {
  php = `
<?php

[
    [
        'tipo' => 'Función',
        'devolver' => true,
        'contexto' => [
            
        ],
        'valor' => [
            
        ]
    ]
];`;
}

const Código = van.state(phpArrayReader.fromString(php));

const Acción = van.state('');

const visualización = document.querySelector('#visualización');
visualización.onclick = click => {
  Seleccionar({ click, indicador: [] });
};

Visualizar();

Estilo({
  nombre: 'Visualización',
  css: {
    '#visualización': {

      ' .Nueva-línea': {
        padding: '0.25rem',
        'background-color': 'rgba(0, 25, 0, 0.2)'
      }
    }
  }
});

export { Acción, Código };
//# sourceMappingURL=compilación.js.map
