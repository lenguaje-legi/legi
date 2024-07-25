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

let add$2 = (dom, ...children) => {
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
  return add$2(dom, ...children)
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

var van = {add: add$2, tags, state, derive, hydrate};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

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
var Map = getNative(root, 'Map');

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
    'map': new (Map || ListCache),
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

const { div: div$2, button } = van.tags;

var AgregarTipo = ({ tipo, indicador }) => {
  return div$2(
    button({
      onclick: () => {
        console.log(`Se agregó un tipo: ${tipo}`);

        const propiedades = {
          tipo
        };

        if (tipo === 'Contexto') {
          propiedades.valor = {
            nombre: '',
            tipos: {
              Función: true,
              Lista: true,
              Lógica: true,
              Número: true,
              Texto: true
            }
          };
        }

        if (tipo === 'Función') {
          propiedades.devolver = false;
          propiedades.contexto = [];
          propiedades.valor = [];
        }

        if (tipo === 'Lista') {
          propiedades.devolver = false;
          propiedades.valor = [];
        }

        if (tipo === 'Número') {
          propiedades.devolver = false;
          propiedades.valor = 0;
        }

        if (tipo === 'Texto') {
          propiedades.devolver = false;
          propiedades.valor = '';
        }

        if (tipo === 'Lógica') {
          propiedades.devolver = false;
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

const { add: add$1 } = van;
const { p, h2, div: div$1, fieldset, input, textarea, span: span$7 } = van.tags;

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

  let esElÚltimoElemento;
  let esLaÚltimaNuevaLínea;
  const esLaRaíz = JSON.stringify(indicador) === '[]';

  if (!esLaRaíz && JSON.stringify(indicador) !== '[0]' && JSON.stringify(indicador) !== '[0,"contexto",0]') {
    esElÚltimoElemento = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1) + 1;
    esLaÚltimaNuevaLínea = get(Código.val, indicador.slice(0, -1)).length === indicador.at(-1);
  }

  const visualización = document.querySelector('#visualización');

  const actualizarPropiedad = ({ valor, propiedad, target }) => {
    if (target.value === 'true' || target.value === 'false') {
      if (esLaRaíz) {
        const visualizarLegi = target.value === 'true';
        if (!visualizarLegi) {
          visualización.classList.remove('legi');
        }

        if (visualizarLegi) {
          visualización.classList.add('legi');
        }
      }

      if (Tipo.tipo === 'Contexto') {
        Tipo[propiedad].tipos[Object.keys(Tipo[propiedad].tipos)[target.dataset.propiedad]] = target.value === 'true';
      }

      if (Tipo.tipo !== 'Contexto') {
        Tipo[propiedad] = target.value === 'true';
      }
    }

    if (Tipo.tipo === 'Número' && propiedad === 'valor') {
      if (target.value.trim() === '' || isNaN(target.value)) {
        target.value = valor;
        return null
      }

      target.value = Number(target.value);
    }

    if (target.value !== 'true' && target.value !== 'false') {
      if (Tipo.tipo === 'Contexto') {
        Tipo[propiedad][target.dataset.propiedad] = target.value;
      }

      if (Tipo.tipo !== 'Contexto') {
        Tipo[propiedad] = target.value;
      }
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

  if (tipo === undefined) {
    editarPropiedades = [
      h2(
        {
          class: 'tipo'
        },
        'Visualización'
      ),
      div$1(
        {
          class: 'lógica'
        },
        fieldset(
          div$1(
            input({
              type: 'radio',
              name: 'visualización',
              checked: (() => {
                if (visualización.classList.contains('legi')) {
                  return true
                }
              })(),
              value: true,
              onchange: ({ target }) => {
                console.log('Se confirmó un cambio');
                if (target.checked) {
                  target.value = true;
                }
                actualizarPropiedad({ target });
              }
            }),
            p('Legi')
          ),
          div$1(
            input({
              type: 'radio',
              name: 'visualización',
              checked: (() => {
                if (!visualización.classList.contains('legi')) {
                  return true
                }
              })(),
              value: false,
              onchange: ({ target }) => {
                console.log('Se confirmó un cambio');
                if (target.checked) {
                  target.value = false;
                }
                actualizarPropiedad({ target });
              }
            }),
            p('PHP')
          )
        )
      )
    ];
  }

  if (tipo === 'Nueva línea') {
    if (esLaÚltimaNuevaLínea && últimoElemento.devolver) {
      return null
    }

    if (indicador.slice(0, -1).at(-1) !== 'contexto') {
      editarPropiedades = div$1(
        AgregarTipo({
          tipo: 'Función',
          indicador
        }),
        AgregarTipo({
          tipo: 'Lista',
          indicador
        }),
        AgregarTipo({
          tipo: 'Número',
          indicador
        }),
        AgregarTipo({
          tipo: 'Texto',
          indicador
        }),
        AgregarTipo({
          tipo: 'Lógica',
          indicador
        }),
        AgregarTipo({
          tipo: 'Comentario',
          indicador
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
              actualizarPropiedad({ valor, propiedad, target });
            }
          }),
          span$7({
            class: 'marca',
            onclick: ({ target }) => {
              target.parentNode.childNodes[0].click();
            }
          }),
          p(capitalize(propiedad))
        )
      }

      if (tipo === 'Contexto') {
        return [
          div$1(
            {
              class: 'propiedad'
            },
            p('Nombre'),
            input({
              value: Tipo[propiedad].nombre,
              'data-propiedad': 'nombre',
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
                actualizarPropiedad({ valor, propiedad, target });
              },
              onkeyup: ({ target, key, shiftKey }) => {
                if (key !== undefined && key !== 'Enter') {
                  return
                }

                confirmado = true;
                target.blur();
                if (valor === target.value) {
                  return
                }
                console.log('Se confirmó un cambio');
                actualizarPropiedad({ valor, propiedad, target });
              }
            })
          ),
          (() => {
            return Object.keys(Tipo[propiedad].tipos).map((tipo, indicador) => {
              return div$1(
                {
                  class: 'verificación'
                },
                input({
                  type: 'checkbox',
                  checked: Tipo[propiedad].tipos[Object.keys(Tipo[propiedad].tipos)[indicador]],
                  value: Tipo[propiedad].tipos[Object.keys(Tipo[propiedad].tipos)[indicador]],
                  'data-propiedad': indicador,
                  onchange: ({ target }) => {
                    console.log('Se confirmó un cambio');
                    if (target.checked) {
                      target.value = true;
                    }
                    if (!target.checked) {
                      target.value = false;
                    }
                    actualizarPropiedad({ valor, propiedad, target });
                  }
                }),
                span$7({
                  class: 'marca',
                  onclick: ({ target }) => {
                    target.parentNode.childNodes[0].click();
                  }
                }),
                p(tipo)
              )
            })
          })()
        ]
      }

      if (tipo === 'Lógica') {
        return div$1(
          {
            class: 'lógica'
          },
          fieldset(
            div$1(
              input({
                type: 'radio',
                name: 'lógica',
                checked: (() => {
                  if (Tipo[propiedad] === true) {
                    return true
                  }
                })(),
                value: true,
                onchange: ({ target }) => {
                  console.log('Se confirmó un cambio');
                  if (target.checked) {
                    target.value = true;
                  }
                  actualizarPropiedad({ valor, propiedad, target });
                }
              }),
              p('Cierto')
            ),
            div$1(
              input({
                type: 'radio',
                name: 'lógica',
                checked: (() => {
                  if (Tipo[propiedad] === false) {
                    return true
                  }
                })(),
                value: false,
                onchange: ({ target }) => {
                  console.log('Se confirmó un cambio');
                  if (target.checked) {
                    target.value = false;
                  }
                  actualizarPropiedad({ valor, propiedad, target });
                }
              }),
              p('Falso')
            )
          )
        )
      }

      let casilla = input;

      if (tipo === 'Texto' || tipo === 'Comentario') {
        casilla = textarea;
      }

      setTimeout(() => {
        if (tipo === 'Texto' && propiedad === 'valor') {
          const casilla = document.querySelector(`#propiedades [data-propiedad='${propiedad}']`);
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
          'data-propiedad': propiedad,
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
            actualizarPropiedad({ valor, propiedad, target });
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
            actualizarPropiedad({ valor, propiedad, target });
          }
        })
      )
    });
  }

  add$1(propiedades, editarPropiedades);
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

const { pre: pre$6, span: span$6 } = van.tags;

var Función = ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1;

  const función = get(Código.val, indicador);

  const legi = document.querySelector('#visualización').classList.contains('legi');
  let devolver = '';

  if (función.devolver) {
    if (legi) {
      devolver = '<- ';
    }

    if (!legi) {
      devolver = 'return ';
    }
  }

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

  const elementoSuperior = get(Código.val, indicador.slice(0, -2));
  let elElementoSuperiorEsUnaLista = false;
  if (elementoSuperior && elementoSuperior.tipo === 'Lista') {
    elElementoSuperiorEsUnaLista = true;
  }

  return [
    pre$6(
      span$6(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
      ),
      (() => {
        if (!devolver) {
          return null
        }

        return span$6(
          {
            class: 'devolver'
          },
          devolver
        )
      })(),
      span$6(
        {
          class: 'función'
        },
        (() => {
          if (legi) {
            return '->'
          }

          return 'function'
        })()
      )
    ),
    pre$6(
      span$6(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios)}`
      ),
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
    pre$6(
      span$6(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios)}`
      ),
      span$6(
        {
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
    pre$6(
      span$6(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
      ),
      span$6(
        {
          class: 'ruido llave'
        },
        '}'
      ),
      (() => {
        if (elElementoSuperiorEsUnaLista) {
          const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
            return elemento.tipo !== 'Comentario'
          });

          const esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1);

          if (esElÚltimoElemento) {
            return null
          }
          return span$6(
            {
              class: 'ruido coma'
            },
            ','
          )
        }

        return span$6(
          {
            class: 'ruido punto-y-coma'
          },
          ';'
        )
      })()
    )
  ]
};

const { pre: pre$5, span: span$5 } = van.tags;

var Contexto = ({ bloquesDeEspacios, indicador, valor }) => {
  const contexto = get(Código.val, indicador);

  return pre$5(
    span$5(
      {
        class: 'bloque-de-espacios'
      },
          `${'    '.repeat(bloquesDeEspacios + 1)}`
    ),
    span$5(
      {
        class: 'signo-de-dólar'
      },
      '$'
    ),
    contexto.valor.nombre
  )
};

const { pre: pre$4, span: span$4 } = van.tags;

var Lista = ({ bloquesDeEspacios, indicador }) => {
  bloquesDeEspacios = bloquesDeEspacios + 1;

  const lista = get(Código.val, indicador);

  const legi = document.querySelector('#visualización').classList.contains('legi');
  let devolver = '';

  if (lista.devolver) {
    if (legi) {
      devolver = '<- ';
    }

    if (!legi) {
      devolver = 'return ';
    }
  }

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

  const elementoSuperior = get(Código.val, indicador.slice(0, -2));
  let elElementoSuperiorEsUnaLista = false;
  if (elementoSuperior && elementoSuperior.tipo === 'Lista') {
    elElementoSuperiorEsUnaLista = true;
  }

  return [
    pre$4(
      span$4(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
      ),
      (() => {
        if (!devolver) {
          return null
        }

        return span$4(
          {
            class: 'devolver'
          },
          devolver
        )
      })(),
      span$4(
        {
          class: 'corchete'
        },
        '['
      )
    ),
    Tipo({ tipo: 'Nueva línea', indicador: [...indicador, 'valor', 0] }),
    código,
    pre$4(
      span$4(
        {
          class: 'bloque-de-espacios'
        },
          `${'    '.repeat(bloquesDeEspacios - 1)}`
      ),
      span$4(
        {
          class: 'corchete'
        },
        ']'
      ),
      (() => {
        if (elElementoSuperiorEsUnaLista) {
          const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
            return elemento.tipo !== 'Comentario'
          });

          const esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1);

          if (esElÚltimoElemento) {
            return null
          }
          return span$4(
            {
              class: 'ruido coma'
            },
            ','
          )
        }

        return span$4(
          {
            class: 'ruido punto-y-coma'
          },
          ';'
        )
      })()
    )
  ]
};

const { pre: pre$3, span: span$3 } = van.tags;

var Lógica = ({ bloquesDeEspacios, indicador, valor }) => {
  const lógica = get(Código.val, indicador);

  const legi = document.querySelector('#visualización').classList.contains('legi');
  let devolver = '';

  if (lógica.devolver) {
    if (legi) {
      devolver = '<- ';
    }

    if (!legi) {
      devolver = 'return ';
    }
  }

  const elementoSuperior = get(Código.val, indicador.slice(0, -2));
  let elElementoSuperiorEsUnaLista = false;
  if (elementoSuperior && elementoSuperior.tipo === 'Lista') {
    elElementoSuperiorEsUnaLista = true;
  }

  return pre$3(
    span$3(
      {
        class: 'bloque-de-espacios'
      },
          `${'    '.repeat(bloquesDeEspacios)}`
    ),
    (() => {
      if (!devolver) {
        return null
      }

      return span$3(
        {
          class: 'devolver'
        },
        devolver
      )
    })(),
    valor,
    (() => {
      if (elElementoSuperiorEsUnaLista) {
        const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
          return elemento.tipo !== 'Comentario'
        });

        const esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1);

        if (esElÚltimoElemento) {
          return null
        }
        return span$3(
          {
            class: 'ruido coma'
          },
          ','
        )
      }

      return span$3(
        {
          class: 'ruido punto-y-coma'
        },
        ';'
      )
    })()
  )
};

const { pre: pre$2, span: span$2 } = van.tags;

var Número = ({ bloquesDeEspacios, indicador, valor }) => {
  const número = get(Código.val, indicador);

  const legi = document.querySelector('#visualización').classList.contains('legi');
  let devolver = '';

  if (número.devolver) {
    if (legi) {
      devolver = '<- ';
    }

    if (!legi) {
      devolver = 'return ';
    }
  }

  const elementoSuperior = get(Código.val, indicador.slice(0, -2));
  let elElementoSuperiorEsUnaLista = false;
  if (elementoSuperior && elementoSuperior.tipo === 'Lista') {
    elElementoSuperiorEsUnaLista = true;
  }

  return pre$2(
    span$2(
      {
        class: 'bloque-de-espacios'
      },
          `${'    '.repeat(bloquesDeEspacios)}`
    ),
    (() => {
      if (!devolver) {
        return null
      }

      return span$2(
        {
          class: 'devolver'
        },
        devolver
      )
    })(),
    valor,
    (() => {
      if (elElementoSuperiorEsUnaLista) {
        const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
          return elemento.tipo !== 'Comentario'
        });

        const esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1);

        if (esElÚltimoElemento) {
          return null
        }
        return span$2(
          {
            class: 'ruido coma'
          },
          ','
        )
      }

      return span$2(
        {
          class: 'ruido punto-y-coma'
        },
        ';'
      )
    })()
  )
};

const { pre: pre$1, span: span$1 } = van.tags;

var Texto = ({ bloquesDeEspacios, indicador, valor }) => {
  const texto = get(Código.val, indicador);

  const legi = document.querySelector('#visualización').classList.contains('legi');
  let devolver = '';

  if (texto.devolver) {
    if (legi) {
      devolver = '<- ';
    }

    if (!legi) {
      devolver = 'return ';
    }
  }

  const elementoSuperior = get(Código.val, indicador.slice(0, -2));
  let elElementoSuperiorEsUnaLista = false;
  if (elementoSuperior && elementoSuperior.tipo === 'Lista') {
    elElementoSuperiorEsUnaLista = true;
  }

  return [
    pre$1(
      span$1(
        {
          class: 'bloque-de-espacios'
        },
        '    '.repeat(bloquesDeEspacios)
      ),
      (() => {
        if (!devolver) {
          return null
        }

        return span$1(
          {
            class: 'devolver'
          },
          devolver
        )
      })(),
      span$1(
        {
          class: 'inicio-de-texto'
        },
        '<<<_'
      )
    ),
    (() => {
      if (valor === '') {
        return ''
      }

      valor = valor.split('\n').map(valor => {
        return pre$1(
          {
            class: 'texto'
          },
          span$1(
            {
              class: 'bloque-de-espacios'
            },
            '    '.repeat(bloquesDeEspacios + 1)
          ),
          valor
        )
      });

      return valor
    })(),
    pre$1(
      span$1(
        {
          class: 'bloque-de-espacios'
        },
        '    '.repeat(bloquesDeEspacios + 1)
      ),
      span$1(
        {
          class: 'final-de-texto'
        },
        '_'
      ),
      (() => {
        if (elElementoSuperiorEsUnaLista) {
          const elementosEnLaLista = elementoSuperior.valor.filter(elemento => {
            return elemento.tipo !== 'Comentario'
          });

          const esElÚltimoElemento = get(Código.val, indicador) === elementosEnLaLista.at(-1);

          if (esElÚltimoElemento) {
            return null
          }
          return span$1(
            {
              class: 'ruido coma'
            },
            ','
          )
        }

        return span$1(
          {
            class: 'ruido punto-y-coma'
          },
          ';'
        )
      })()
    )
  ]
};

const { pre, span } = van.tags;

var Comentario = ({ bloquesDeEspacios, valor }) => {
  return valor.split('\n').map(valor => {
    return pre(
      span(
        {
          class: 'bloque-de-espacios'
        },
        '    '.repeat(bloquesDeEspacios)
      ),
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

var Tipo = ({ tipo, bloquesDeEspacios, indicador, valor, asignación }) => {
  if (!tipo) {
    tipo = get(Código.val, indicador).tipo;
  }

  if (asignación) {
    valor = `$${asignación} = ${valor}`;
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

  return div(
    {
      'data-indicador': (() => {
        if (tipo === 'Nueva línea') {
          return ''
        }
        return JSON.stringify(indicador)
      })(),
      class: `Tipo ${tipo.replaceAll(' ', '-')}`,
      onclick: (click) => {
        Seleccionar({ click, indicador, tipo });
      }
    },
    valor
  )
};

const { add } = van;

var Visualizar = () => {
  const visualización = document.querySelector('#visualización');
  visualización.innerHTML = '';
  add(visualización, Tipo({
    bloquesDeEspacios: 0,
    indicador: [0]
  }));
};

const Código = van.state([
  {
    tipo: 'Función',
    devolver: true,
    contexto: [],
    valor: []
  }
]);

const Acción = van.state('');

const visualización = document.querySelector('#visualización');
visualización.onclick = click => {
  Seleccionar({ click, indicador: [] });
};

Visualizar();

export { Acción, Código };
//# sourceMappingURL=compilación.js.map
