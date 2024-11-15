"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.relativeJsonPointer = exports.jsonPointer = exports.duration = exports.time = exports.date = exports.datetime = exports.url = exports.uriTemplate = exports.uriReference = exports.uri = exports.ipv6 = exports.ipv4 = exports.iriReference = exports.iri = exports.idnHostname = exports.idnEmail = exports.hostname = exports.email = exports.uuid = exports.regex = exports.password = exports.byte = exports.pattern = exports.length = exports.pick = exports.array = exports.string = exports.number = exports.bigint = exports.integer = exports.boolean = void 0;
var randexp_1 = __importDefault(require("randexp"));
var ALPHABETS = "abcdefghijklmnopqrstuvwxyz";
/* -----------------------------------------------------------
  REGULAR
----------------------------------------------------------- */
var boolean = function () { return Math.random() < 0.5; };
exports.boolean = boolean;
var integer = function (min, max) {
    min !== null && min !== void 0 ? min : (min = 0);
    max !== null && max !== void 0 ? max : (max = 100);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.integer = integer;
var bigint = function (min, max) {
    return BigInt((0, exports.integer)(Number(min !== null && min !== void 0 ? min : BigInt(0)), Number(max !== null && max !== void 0 ? max : BigInt(100))));
};
exports.bigint = bigint;
var number = function (min, max) {
    min !== null && min !== void 0 ? min : (min = 0);
    max !== null && max !== void 0 ? max : (max = 100);
    return Math.random() * (max - min) + min;
};
exports.number = number;
var string = function (length) {
    return new Array(length !== null && length !== void 0 ? length : (0, exports.integer)(5, 10))
        .fill(0)
        .map(function () { return ALPHABETS[(0, exports.integer)(0, ALPHABETS.length - 1)]; })
        .join("");
};
exports.string = string;
var array = function (closure, count, unique) {
    count !== null && count !== void 0 ? count : (count = (0, exports.length)());
    unique !== null && unique !== void 0 ? unique : (unique = false);
    if (unique === false)
        return new Array(count !== null && count !== void 0 ? count : (0, exports.length)())
            .fill(0)
            .map(function (_e, index) { return closure(index); });
    else {
        var set = new Set();
        while (set.size < count)
            set.add(closure(set.size));
        return Array.from(set);
    }
};
exports.array = array;
var pick = function (array) { return array[(0, exports.integer)(0, array.length - 1)]; };
exports.pick = pick;
var length = function () { return (0, exports.integer)(0, 3); };
exports.length = length;
var pattern = function (regex) {
    var r = new randexp_1.default(regex);
    for (var i = 0; i < 10; ++i) {
        var str = r.gen();
        if (regex.test(str))
            return str;
    }
    return r.gen();
};
exports.pattern = pattern;
/* -----------------------------------------------------------
  SECIAL FORMATS
----------------------------------------------------------- */
// SPECIAL CHARACTERS
var byte = function () { return "vt7ekz4lIoNTTS9sDQYdWKharxIFAR54+z/umIxSgUM="; };
exports.byte = byte;
var password = function () { return (0, exports.string)((0, exports.integer)(4, 16)); };
exports.password = password;
var regex = function () {
    return "/^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/";
};
exports.regex = regex;
var uuid = function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
exports.uuid = uuid;
// ADDRESSES
var email = function () { return "".concat((0, exports.string)(10), "@").concat((0, exports.string)(10), ".").concat((0, exports.string)(3)); };
exports.email = email;
var hostname = function () { return "".concat((0, exports.string)(10), ".").concat((0, exports.string)(3)); };
exports.hostname = hostname;
var idnEmail = function () { return (0, exports.email)(); };
exports.idnEmail = idnEmail;
var idnHostname = function () { return (0, exports.hostname)(); };
exports.idnHostname = idnHostname;
var iri = function () { return (0, exports.url)(); };
exports.iri = iri;
var iriReference = function () { return (0, exports.url)(); };
exports.iriReference = iriReference;
var ipv4 = function () { return (0, exports.array)(function () { return (0, exports.integer)(0, 255); }, 4).join("."); };
exports.ipv4 = ipv4;
var ipv6 = function () {
    return (0, exports.array)(function () { return (0, exports.integer)(0, 65535).toString(16); }, 8).join(":");
};
exports.ipv6 = ipv6;
var uri = function () { return (0, exports.url)(); };
exports.uri = uri;
var uriReference = function () { return (0, exports.url)(); };
exports.uriReference = uriReference;
var uriTemplate = function () { return (0, exports.url)(); };
exports.uriTemplate = uriTemplate;
var url = function () { return "https://".concat((0, exports.string)(10), ".").concat((0, exports.string)(3)); };
exports.url = url;
// TIMESTAMPS
var datetime = function (min, max) {
    return new Date((0, exports.number)(min !== null && min !== void 0 ? min : Date.now() - 30 * DAY, max !== null && max !== void 0 ? max : Date.now() + 7 * DAY)).toISOString();
};
exports.datetime = datetime;
var date = function (min, max) {
    return new Date((0, exports.number)(min !== null && min !== void 0 ? min : 0, max !== null && max !== void 0 ? max : Date.now() * 2))
        .toISOString()
        .substring(0, 10);
};
exports.date = date;
var time = function () { return new Date((0, exports.number)(0, DAY)).toISOString().substring(11); };
exports.time = time;
var duration = function () {
    var period = durate([
        ["Y", (0, exports.integer)(0, 100)],
        ["M", (0, exports.integer)(0, 12)],
        ["D", (0, exports.integer)(0, 31)],
    ]);
    var time = durate([
        ["H", (0, exports.integer)(0, 24)],
        ["M", (0, exports.integer)(0, 60)],
        ["S", (0, exports.integer)(0, 60)],
    ]);
    if (period.length + time.length === 0)
        return "PT0S";
    return "P".concat(period).concat(time.length ? "T" : "").concat(time);
};
exports.duration = duration;
// POINTERS
var jsonPointer = function () { return "/components/schemas/".concat((0, exports.string)(10)); };
exports.jsonPointer = jsonPointer;
var relativeJsonPointer = function () { return "".concat((0, exports.integer)(0, 10), "#"); };
exports.relativeJsonPointer = relativeJsonPointer;
var DAY = 86400000;
var durate = function (elements) {
    return elements
        .filter(function (_a) {
        var _b = __read(_a, 2), _unit = _b[0], value = _b[1];
        return value !== 0;
    })
        .map(function (_a) {
        var _b = __read(_a, 2), unit = _b[0], value = _b[1];
        return "".concat(value).concat(unit);
    })
        .join("");
};
//# sourceMappingURL=RandomGenerator.js.map