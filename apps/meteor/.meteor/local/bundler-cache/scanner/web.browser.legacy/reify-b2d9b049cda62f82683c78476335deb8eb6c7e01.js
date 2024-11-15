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
exports.createValidateSnake = exports.createIsSnake = exports.createAssertSnake = exports.createSnake = exports.createValidatePascal = exports.createIsPascal = exports.createAssertPascal = exports.createPascal = exports.createValidateCamel = exports.createIsCamel = exports.createAssertCamel = exports.createCamel = exports.validateSnake = exports.isSnake = exports.assertSnake = exports.snake = exports.validatePascal = exports.isPascal = exports.assertPascal = exports.pascal = exports.validateCamel = exports.isCamel = exports.assertCamel = exports.camel = void 0;
var Namespace = __importStar(require("./functional/Namespace"));
/**
 * @internal
 */
function camel() {
    return halt("camel");
}
var camelPure = /** @__PURE__ */ Object.assign(camel, 
/** @__PURE__ */ Namespace.notations.camel("camel"));
exports.camel = camelPure;
/**
 * @internal
 */
function assertCamel() {
    return halt("assertCamel");
}
var assertCamelPure = /** @__PURE__ */ Object.assign(assertCamel, 
/** @__PURE__ */ Namespace.notations.camel("assertCamel"), 
/** @__PURE__ */ Namespace.assert("notations.assertCamel"));
exports.assertCamel = assertCamelPure;
/**
 * @internal
 */
function isCamel() {
    return halt("isCamel");
}
var isCamelPure = /** @__PURE__ */ Object.assign(isCamel, 
/** @__PURE__ */ Namespace.notations.camel("isCamel"), 
/** @__PURE__ */ Namespace.is());
exports.isCamel = isCamelPure;
/**
 * @internal
 */
function validateCamel() {
    return halt("validateCamel");
}
var validateCamelPure = /** @__PURE__ */ Object.assign(validateCamel, 
/** @__PURE__ */ Namespace.notations.camel("validateCamel"), 
/** @__PURE__ */ Namespace.validate());
exports.validateCamel = validateCamelPure;
/**
 * @internal
 */
function pascal() {
    return halt("pascal");
}
var pascalPure = /** @__PURE__ */ Object.assign(pascal, 
/** @__PURE__ */ Namespace.notations.pascal("pascal"));
exports.pascal = pascalPure;
/**
 * @internal
 */
function assertPascal() {
    return halt("assertPascal");
}
var assertPascalPure = /** @__PURE__ */ Object.assign(assertPascal, 
/** @__PURE__ */ Namespace.notations.pascal("assertPascal"), 
/** @__PURE__ */ Namespace.assert("notations.assertPascal"));
exports.assertPascal = assertPascalPure;
/**
 * @internal
 */
function isPascal() {
    return halt("isPascal");
}
var isPascalPure = /** @__PURE__ */ Object.assign(isPascal, 
/** @__PURE__ */ Namespace.notations.pascal("isPascal"), 
/** @__PURE__ */ Namespace.is());
exports.isPascal = isPascalPure;
/**
 * @internal
 */
function validatePascal() {
    return halt("validatePascal");
}
var validatePascalPure = /** @__PURE__ */ Object.assign(validatePascal, 
/** @__PURE__ */ Namespace.notations.pascal("validatePascal"), 
/** @__PURE__ */ Namespace.validate());
exports.validatePascal = validatePascalPure;
/**
 * @internal
 */
function snake() {
    return halt("snake");
}
var snakePure = /** @__PURE__ */ Object.assign(snake, 
/** @__PURE__ */ Namespace.notations.snake("snake"));
exports.snake = snakePure;
/**
 * @internal
 */
function assertSnake() {
    return halt("assertSnake");
}
var assertSnakePure = /** @__PURE__ */ Object.assign(assertSnake, 
/** @__PURE__ */ Namespace.notations.snake("assertSnake"), 
/** @__PURE__ */ Namespace.assert("notations.assertSnake"));
exports.assertSnake = assertSnakePure;
/**
 * @internal
 */
function isSnake() {
    return halt("isSnake");
}
var isSnakePure = /** @__PURE__ */ Object.assign(isSnake, 
/** @__PURE__ */ Namespace.notations.snake("isSnake"), 
/** @__PURE__ */ Namespace.is());
exports.isSnake = isSnakePure;
/**
 * @internal
 */
function validateSnake() {
    return halt("validateSnake");
}
var validateSnakePure = /** @__PURE__ */ Object.assign(validateSnake, 
/** @__PURE__ */ Namespace.notations.snake("validateSnake"), 
/** @__PURE__ */ Namespace.validate());
exports.validateSnake = validateSnakePure;
/**
 * @internal
 */
function createCamel() {
    halt("createCamel");
}
var createCamelPure = /** @__PURE__ */ Object.assign(createCamel, 
/** @__PURE__ */ Namespace.notations.camel("createCamel"));
exports.createCamel = createCamelPure;
/**
 * @internal
 */
function createAssertCamel() {
    halt("createAssertCamel");
}
var createAssertCamelPure = /** @__PURE__ */ Object.assign(createAssertCamel, 
/** @__PURE__ */ Namespace.notations.camel("createAssertCamel"), 
/** @__PURE__ */ Namespace.assert("notations.createAssertCamel"));
exports.createAssertCamel = createAssertCamelPure;
/**
 * @internal
 */
function createIsCamel() {
    halt("createIsCamel");
}
var createIsCamelPure = /** @__PURE__ */ Object.assign(createIsCamel, 
/** @__PURE__ */ Namespace.notations.camel("createIsCamel"), 
/** @__PURE__ */ Namespace.is());
exports.createIsCamel = createIsCamelPure;
/**
 * @internal
 */
function createValidateCamel() {
    halt("createValidateCamel");
}
var createValidateCamelPure = /** @__PURE__ */ Object.assign(createValidateCamel, 
/** @__PURE__ */ Namespace.notations.camel("createValidateCamel"), 
/** @__PURE__ */ Namespace.validate());
exports.createValidateCamel = createValidateCamelPure;
/**
 * @internal
 */
function createPascal() {
    halt("createPascal");
}
var createPascalPure = /** @__PURE__ */ Object.assign(createPascal, /** @__PURE__ */ Namespace.notations.pascal("createPascal"));
exports.createPascal = createPascalPure;
/**
 * @internal
 */
function createAssertPascal() {
    halt("createAssertPascal");
}
var createAssertPascalPure = /** @__PURE__ */ Object.assign(createAssertPascal, 
/** @__PURE__ */ Namespace.notations.pascal("createAssertPascal"), 
/** @__PURE__ */ Namespace.assert("notations.createAssertPascal"));
exports.createAssertPascal = createAssertPascalPure;
/**
 * @internal
 */
function createIsPascal() {
    halt("createIsPascal");
}
var createIsPascalPure = /** @__PURE__ */ Object.assign(createIsPascal, 
/** @__PURE__ */ Namespace.notations.pascal("createIsPascal"), 
/** @__PURE__ */ Namespace.is());
exports.createIsPascal = createIsPascalPure;
/**
 * @internal
 */
function createValidatePascal() {
    halt("createValidatePascal");
}
var createValidatePascalPure = /** @__PURE__ */ Object.assign(createValidatePascal, 
/** @__PURE__ */ Namespace.notations.pascal("createValidatePascal"), 
/** @__PURE__ */ Namespace.validate());
exports.createValidatePascal = createValidatePascalPure;
/**
 * @internal
 */
function createSnake() {
    halt("createSnake");
}
var createSnakePure = /** @__PURE__ */ Object.assign(createSnake, 
/** @__PURE__ */ Namespace.notations.snake("createSnake"));
exports.createSnake = createSnakePure;
/**
 * @internal
 */
function createAssertSnake() {
    halt("createAssertSnake");
}
var createAssertSnakePure = /** @__PURE__ */ Object.assign(createAssertSnake, 
/** @__PURE__ */ Namespace.notations.snake("createAssertSnake"), 
/** @__PURE__ */ Namespace.assert("notations.createAssertSnake"));
exports.createAssertSnake = createAssertSnakePure;
/**
 * @internal
 */
function createIsSnake() {
    halt("createIsSnake");
}
var createIsSnakePure = /** @__PURE__ */ Object.assign(createIsSnake, 
/** @__PURE__ */ Namespace.notations.snake("createIsSnake"), 
/** @__PURE__ */ Namespace.is());
exports.createIsSnake = createIsSnakePure;
/**
 * @internal
 */
function createValidateSnake() {
    halt("createValidateSnake");
}
var createValidateSnakePure = /** @__PURE__ */ Object.assign(createValidateSnake, 
/** @__PURE__ */ Namespace.notations.snake("createValidateSnake"), 
/** @__PURE__ */ Namespace.validate());
exports.createValidateSnake = createValidateSnakePure;
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.notations.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=notations.js.map