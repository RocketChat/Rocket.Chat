"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pascal = exports.camel = void 0;
exports.snake = snake;
var StringUtil_1 = require("../StringUtil");
function snake(str) {
    if (str.length === 0)
        return str;
    // PREFIX
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    var prefix = "";
    for (var i = 0; i < str.length; i++) {
        if (str[i] === "_")
            prefix += "_";
        else
            break;
    }
    if (prefix.length !== 0)
        str = str.substring(prefix.length);
    var out = function (s) { return "".concat(prefix).concat(s); };
    // SNAKE CASE
    var items = str.split("_");
    if (items.length > 1)
        return out(items.map(function (s) { return s.toLowerCase(); }).join("_"));
    // CAMEL OR PASCAL CASE
    var indexes = [];
    for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        if (65 <= code && code <= 90)
            indexes.push(i);
    }
    for (var i = indexes.length - 1; i > 0; --i) {
        var now = indexes[i];
        var prev = indexes[i - 1];
        if (now - prev === 1)
            indexes.splice(i, 1);
    }
    if (indexes.length !== 0 && indexes[0] === 0)
        indexes.splice(0, 1);
    if (indexes.length === 0)
        return str.toLowerCase();
    var ret = "";
    for (var i = 0; i < indexes.length; i++) {
        var first = i === 0 ? 0 : indexes[i - 1];
        var last = indexes[i];
        ret += str.substring(first, last).toLowerCase();
        ret += "_";
    }
    ret += str.substring(indexes[indexes.length - 1]).toLowerCase();
    return out(ret);
}
var camel = function (str) {
    return unsnake({
        plain: function (str) {
            return str.length
                ? str === str.toUpperCase()
                    ? str.toLocaleLowerCase()
                    : "".concat(str[0].toLowerCase()).concat(str.substring(1))
                : str;
        },
        snake: function (str, i) {
            return i === 0 ? str.toLowerCase() : StringUtil_1.StringUtil.capitalize(str.toLowerCase());
        },
    })(str);
};
exports.camel = camel;
var pascal = function (str) {
    return unsnake({
        plain: function (str) {
            return str.length ? "".concat(str[0].toUpperCase()).concat(str.substring(1)) : str;
        },
        snake: StringUtil_1.StringUtil.capitalize,
    })(str);
};
exports.pascal = pascal;
var unsnake = function (props) {
    return function (str) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        var prefix = "";
        for (var i = 0; i < str.length; i++) {
            if (str[i] === "_")
                prefix += "_";
            else
                break;
        }
        if (prefix.length !== 0)
            str = str.substring(prefix.length);
        var out = function (s) { return "".concat(prefix).concat(s); };
        if (str.length === 0)
            return out("");
        var items = str.split("_").filter(function (s) { return s.length !== 0; });
        return items.length === 0
            ? out("")
            : items.length === 1
                ? out(props.plain(items[0]))
                : out(items.map(props.snake).join(""));
    };
};
//# sourceMappingURL=NamingConvention.js.map