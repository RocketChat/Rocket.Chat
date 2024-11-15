"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Returns React children into an array, flattening fragments. */
var react_1 = require("react");
var react_is_1 = require("react-is");
function flattenChildren(children, depth, keys) {
    if (depth === void 0) { depth = 0; }
    if (keys === void 0) { keys = []; }
    return react_1.Children.toArray(children).reduce(function (acc, node, nodeIndex) {
        if (react_is_1.isFragment(node)) {
            acc.push.apply(acc, flattenChildren(node.props.children, depth + 1, keys.concat(node.key || nodeIndex)));
        }
        else {
            if (react_1.isValidElement(node)) {
                acc.push(react_1.cloneElement(node, {
                    key: keys.concat(String(node.key)).join('.')
                }));
            }
            else if (typeof node === "string" || typeof node === "number") {
                acc.push(node);
            }
        }
        return acc;
    }, []);
}
exports.default = flattenChildren;
