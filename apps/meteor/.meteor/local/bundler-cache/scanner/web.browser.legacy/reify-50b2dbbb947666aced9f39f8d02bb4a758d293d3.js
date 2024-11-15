"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEqualsReturn = exports.validateEqualsParameters = exports.validateEqualsFunction = exports.validateReturn = exports.validateParameters = exports.validateFunction = exports.equalsReturn = exports.equalsParameters = exports.equalsFunction = exports.isReturn = exports.isParameters = exports.isFunction = exports.assertEqualsReturn = exports.assertEqualsParameters = exports.assertEqualsFunction = exports.assertReturn = exports.assertParameters = exports.assertFunction = void 0;
var Namespace = __importStar(require("./functional/Namespace"));
/**
 * @internal
 */
function assertFunction() {
    halt("assertFunction");
}
var assertFunctionPure = /** @__PURE__ */ Object.assign(assertFunction, 
/** @__PURE__ */ Namespace.assert("functional.assertFunction"), 
/** @__PURE__ */ Namespace.functional.functionalAssert());
exports.assertFunction = assertFunctionPure;
/**
 * @internal
 */
function assertParameters() {
    halt("assertParameters");
}
var assertParametersPure = /** @__PURE__ */ Object.assign(assertFunction, 
/** @__PURE__ */ Namespace.assert("functional.assertFunction"), 
/** @__PURE__ */ Namespace.functional.functionalAssert());
exports.assertParameters = assertParametersPure;
/**
 * @internal
 */
function assertReturn() {
    halt("assertReturn");
}
var assertReturnPure = /** @__PURE__ */ Object.assign(assertReturn, 
/** @__PURE__ */ Namespace.assert("functional.assertReturn"), 
/** @__PURE__ */ Namespace.functional.functionalAssert());
exports.assertReturn = assertReturnPure;
/**
 * @internal
 */
function assertEqualsFunction() {
    halt("assertEqualsFunction");
}
var assertEqualsFunctionPure = /** @__PURE__ */ Object.assign(assertEqualsFunction, 
/** @__PURE__ */ Namespace.assert("functional.assertEqualsFunction"), 
/** @__PURE__ */ Namespace.functional.functionalAssert());
exports.assertEqualsFunction = assertEqualsFunctionPure;
/**
 * @internal
 */
function assertEqualsParameters() {
    halt("assertEqualsParameters");
}
var assertEqualsParametersPure = /** @__PURE__ */ Object.assign(assertEqualsParameters, 
/** @__PURE__ */ Namespace.assert("functional.assertEqualsParameters"), 
/** @__PURE__ */ Namespace.functional.functionalAssert());
exports.assertEqualsParameters = assertEqualsParametersPure;
/**
 * @internal
 */
function assertEqualsReturn() {
    halt("assertEqualsReturn");
}
var assertEqualsReturnPure = /** @__PURE__ */ Object.assign(assertEqualsReturn, 
/** @__PURE__ */ Namespace.assert("functional.assertEqualsReturn"), 
/** @__PURE__ */ Namespace.functional.functionalAssert());
exports.assertEqualsReturn = assertEqualsReturnPure;
/**
 * @internal
 */
function isFunction() {
    halt("isFunction");
}
var isFunctionPure = /** @__PURE__ */ Object.assign(isFunction, 
/** @__PURE__ */ Namespace.is());
exports.isFunction = isFunctionPure;
/**
 * @internal
 */
function isParameters() {
    halt("isParameters");
}
var isParametersPure = /** @__PURE__ */ Object.assign(isParameters, /** @__PURE__ */ Namespace.is());
exports.isParameters = isParametersPure;
/**
 * @internal
 */
function isReturn() {
    halt("isReturn");
}
var isReturnPure = /** @__PURE__ */ Object.assign(isReturn, 
/** @__PURE__ */ Namespace.is());
exports.isReturn = isReturnPure;
/**
 * @internal
 */
function equalsFunction() {
    halt("equalsFunction");
}
var equalsFunctionPure = /** @__PURE__ */ Object.assign(equalsFunction, /** @__PURE__ */ Namespace.is());
exports.equalsFunction = equalsFunctionPure;
/**
 * @internal
 */
function equalsParameters() {
    halt("equalsParameters");
}
var equalsParametersPure = /** @__PURE__ */ Object.assign(equalsParameters, /** @__PURE__ */ Namespace.is());
exports.equalsParameters = equalsParametersPure;
/**
 * @internal
 */
function equalsReturn() {
    halt("equalsReturn");
}
var equalsReturnPure = /** @__PURE__ */ Object.assign(equalsReturn, /** @__PURE__ */ Namespace.is());
exports.equalsReturn = equalsReturnPure;
/**
 * @internal
 */
function validateFunction() {
    halt("validateFunction");
}
var validateFunctionPure = /** @__PURE__ */ Object.assign(validateFunction, /** @__PURE__ */ Namespace.validate());
exports.validateFunction = validateFunctionPure;
/**
 * @internal
 */
function validateParameters() {
    halt("validateReturn");
}
var validateParametersPure = /** @__PURE__ */ Object.assign(validateParameters, /** @__PURE__ */ Namespace.validate());
exports.validateParameters = validateParametersPure;
/**
 * @internal
 */
function validateReturn() {
    halt("validateReturn");
}
var validateReturnPure = /** @__PURE__ */ Object.assign(validateReturn, /** @__PURE__ */ Namespace.validate());
exports.validateReturn = validateReturnPure;
/**
 * @internal
 */
function validateEqualsFunction() {
    halt("validateEqualsFunction");
}
var validateEqualsFunctionPure = /** @__PURE__ */ Object.assign(validateEqualsFunction, /** @__PURE__ */ Namespace.validate());
exports.validateEqualsFunction = validateEqualsFunctionPure;
/**
 * @internal
 */
function validateEqualsParameters() {
    halt("validateEqualsParameters");
}
var validateEqualsParametersPure = /** @__PURE__ */ Object.assign(validateEqualsParameters, /** @__PURE__ */ Namespace.validate());
exports.validateEqualsParameters = validateEqualsParametersPure;
/**
 * @internal
 */
function validateEqualsReturn() {
    halt("validateEqualsReturn");
}
var validateEqualsReturnPure = /** @__PURE__ */ Object.assign(validateEqualsReturn, /** @__PURE__ */ Namespace.validate());
exports.validateEqualsReturn = validateEqualsReturnPure;
/* -----------------------------------------------------------
  HALTER
----------------------------------------------------------- */
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.functional.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=functional.js.map