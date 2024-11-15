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
exports.createValidateStringify = exports.createIsStringify = exports.createAssertStringify = exports.createStringify = exports.createValidateParse = exports.createAssertParse = exports.createIsParse = exports.validateStringify = exports.isStringify = exports.assertStringify = exports.stringify = exports.validateParse = exports.isParse = exports.assertParse = void 0;
exports.application = application;
var Namespace = __importStar(require("./functional/Namespace"));
/**
 * @internal
 */
function application() {
    halt("application");
}
/**
 * @internal
 */
function assertParse() {
    halt("assertParse");
}
var assertParsePure = /** @__PURE__ */ Object.assign(assertParse, 
/** @__PURE__ */ Namespace.assert("json.assertParse"));
exports.assertParse = assertParsePure;
/**
 * @internal
 */
function isParse() {
    halt("isParse");
}
var isParsePure = /** @__PURE__ */ Object.assign(isParse, 
/** @__PURE__ */ Namespace.is());
exports.isParse = isParsePure;
/**
 * @internal
 */
function validateParse() {
    halt("validateParse");
}
var validateParsePure = /** @__PURE__ */ Object.assign(validateParse, /** @__PURE__ */ Namespace.validate());
exports.validateParse = validateParsePure;
/**
 * @internal
 */
function stringify() {
    halt("stringify");
}
var stringifyPure = /** @__PURE__ */ Object.assign(stringify, 
/** @__PURE__ */ Namespace.json.stringify("stringify"));
exports.stringify = stringifyPure;
/**
 * @internal
 */
function assertStringify() {
    halt("assertStringify");
}
var assertStringifyPure = /** @__PURE__ */ Object.assign(assertStringify, 
/** @__PURE__ */ Namespace.assert("json.assertStringify"), 
/** @__PURE__ */ Namespace.json.stringify("assertStringify"));
exports.assertStringify = assertStringifyPure;
/**
 * @internal
 */
function isStringify() {
    halt("isStringify");
}
var isStringifyPure = /** @__PURE__ */ Object.assign(isStringify, 
/** @__PURE__ */ Namespace.is(), 
/** @__PURE__ */ Namespace.json.stringify("isStringify"));
exports.isStringify = isStringifyPure;
/**
 * @internal
 */
function validateStringify() {
    halt("validateStringify");
}
var validateStringifyPure = /** @__PURE__ */ Object.assign(validateStringify, 
/** @__PURE__ */ Namespace.validate(), 
/** @__PURE__ */ Namespace.json.stringify("validateStringify"));
exports.validateStringify = validateStringifyPure;
/**
 * @internal
 */
function createIsParse() {
    halt("createIsParse");
}
var createIsParsePure = /** @__PURE__ */ Object.assign(createIsParse, isParsePure);
exports.createIsParse = createIsParsePure;
/**
 * @internal
 */
function createAssertParse() {
    halt("createAssertParse");
}
var createAssertParsePure = /** @__PURE__ */ Object.assign(createAssertParse, assertParsePure);
exports.createAssertParse = createAssertParsePure;
/**
 * @internal
 */
function createValidateParse() {
    halt("createValidateParse");
}
var createValidateParsePure = /** @__PURE__ */ Object.assign(createValidateParse, validateParsePure);
exports.createValidateParse = createValidateParsePure;
/**
 * @internal
 */
function createStringify() {
    halt("createStringify");
}
var createStringifyPure = /** @__PURE__ */ Object.assign(createStringify, stringifyPure);
exports.createStringify = createStringifyPure;
/**
 * @internal
 */
function createAssertStringify() {
    halt("createAssertStringify");
}
var createAssertStringifyPure = /** @__PURE__ */ Object.assign(createAssertStringify, assertStringifyPure);
exports.createAssertStringify = createAssertStringifyPure;
/**
 * @internal
 */
function createIsStringify() {
    halt("createIsStringify");
}
var createIsStringifyPure = /** @__PURE__ */ Object.assign(createIsStringify, isStringifyPure);
exports.createIsStringify = createIsStringifyPure;
/**
 * @internal
 */
function createValidateStringify() {
    halt("createValidateStringify");
}
var createValidateStringifyPure = /** @__PURE__ */ Object.assign(createValidateStringify, validateStringifyPure);
exports.createValidateStringify = createValidateStringifyPure;
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.json.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=json.js.map