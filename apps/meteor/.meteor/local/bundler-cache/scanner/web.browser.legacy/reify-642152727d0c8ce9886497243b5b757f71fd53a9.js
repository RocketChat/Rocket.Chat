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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRandom = exports.createValidateEquals = exports.createEquals = exports.createAssertGuardEquals = exports.createAssertEquals = exports.createValidate = exports.createIs = exports.createAssertGuard = exports.createAssert = exports.random = exports.validateEquals = exports.equals = exports.assertGuardEquals = exports.assertEquals = exports.validate = exports.is = exports.assertGuard = exports.assert = exports.tags = exports.reflect = exports.protobuf = exports.notations = exports.misc = exports.json = exports.http = exports.functional = void 0;
var Namespace = __importStar(require("./functional/Namespace"));
exports.functional = __importStar(require("./functional"));
exports.http = __importStar(require("./http"));
exports.json = __importStar(require("./json"));
exports.misc = __importStar(require("./misc"));
exports.notations = __importStar(require("./notations"));
exports.protobuf = __importStar(require("./protobuf"));
exports.reflect = __importStar(require("./reflect"));
exports.tags = __importStar(require("./tags"));
__exportStar(require("./schemas/metadata/IJsDocTagInfo"), exports);
__exportStar(require("./schemas/json/IJsonApplication"), exports);
__exportStar(require("./AssertionGuard"), exports);
__exportStar(require("./IRandomGenerator"), exports);
__exportStar(require("./IValidation"), exports);
__exportStar(require("./TypeGuardError"), exports);
__exportStar(require("./Primitive"), exports);
__exportStar(require("./Resolved"), exports);
__exportStar(require("./CamelCase"), exports);
__exportStar(require("./PascalCase"), exports);
__exportStar(require("./SnakeCase"), exports);
/**
 * @internal
 */
function assert() {
    halt("assert");
}
var assertPure = /** @__PURE__ */ Object.assign(assert, 
/** @__PURE__ */ Namespace.assert("assert"));
exports.assert = assertPure;
/**
 * @internal
 */
function assertGuard() {
    halt("assertGuard");
}
var assertGuardPure = /** @__PURE__ */ Object.assign(assertGuard, 
/** @__PURE__ */ Namespace.assert("assertGuard"));
exports.assertGuard = assertGuardPure;
/**
 * @internal
 */
function is() {
    halt("is");
}
var isPure = /** @__PURE__ */ Object.assign(is, 
/** @__PURE__ */ Namespace.assert("is"));
exports.is = isPure;
/**
 * @internal
 */
function validate() {
    halt("validate");
}
var validatePure = /** @__PURE__ */ Object.assign(validate, 
/** @__PURE__ */ Namespace.validate());
exports.validate = validatePure;
/**
 * @internal
 */
function assertEquals() {
    halt("assertEquals");
}
var assertEqualsPure = /** @__PURE__ */ Object.assign(assertEquals, /** @__PURE__ */ Namespace.assert("assertEquals"));
exports.assertEquals = assertEqualsPure;
/**
 * @internal
 */
function assertGuardEquals() {
    halt("assertGuardEquals");
}
var assertGuardEqualsPure = /** @__PURE__ */ Object.assign(assertGuardEquals, /** @__PURE__ */ Namespace.assert("assertGuardEquals"));
exports.assertGuardEquals = assertGuardEqualsPure;
/**
 * @internal
 */
function equals() {
    halt("equals");
}
var equalsPure = /** @__PURE__ */ Object.assign(equals, 
/** @__PURE__ */ Namespace.is());
exports.equals = equalsPure;
/**
 * @internal
 */
function validateEquals() {
    halt("validateEquals");
}
var validateEqualsPure = /** @__PURE__ */ Object.assign(validateEquals, /** @__PURE__ */ Namespace.validate());
exports.validateEquals = validateEqualsPure;
/**
 * @internal
 */
function random() {
    halt("random");
}
var randomPure = /** @__PURE__ */ Object.assign(random, 
/** @__PURE__ */ Namespace.random());
exports.random = randomPure;
/**
 * @internal
 */
function createAssert() {
    halt("createAssert");
}
var createAssertPure = /** @__PURE__ */ Object.assign(createAssert, assertPure);
exports.createAssert = createAssertPure;
/**
 * @internal
 */
function createAssertGuard() {
    halt("createAssertGuard");
}
var createAssertGuardPure = /** @__PURE__ */ Object.assign(createAssertGuard, assertGuardPure);
exports.createAssertGuard = createAssertGuardPure;
/**
 * @internal
 */
function createIs() {
    halt("createIs");
}
var createIsPure = /** @__PURE__ */ Object.assign(createIs, isPure);
exports.createIs = createIsPure;
/**
 * @internal
 */
function createValidate() {
    halt("createValidate");
}
var createValidatePure = /** @__PURE__ */ Object.assign(createValidate, validatePure);
exports.createValidate = createValidatePure;
/**
 * @internal
 */
function createAssertEquals() {
    halt("createAssertEquals");
}
var createAssertEqualsPure = /** @__PURE__ */ Object.assign(createAssertEquals, assertEqualsPure);
exports.createAssertEquals = createAssertEqualsPure;
/**
 * @internal
 */
function createAssertGuardEquals() {
    halt("createAssertGuardEquals");
}
var createAssertGuardEqualsPure = /** @__PURE__ */ Object.assign(createAssertGuardEquals, assertGuardEqualsPure);
exports.createAssertGuardEquals = createAssertGuardEqualsPure;
/**
 * @internal
 */
function createEquals() {
    halt("createEquals");
}
var createEqualsPure = /** @__PURE__ */ Object.assign(createEquals, equalsPure);
exports.createEquals = createEqualsPure;
/**
 * @internal
 */
function createValidateEquals() {
    halt("createValidateEquals");
}
var createValidateEqualsPure = /** @__PURE__ */ Object.assign(createValidateEquals, validateEqualsPure);
exports.createValidateEquals = createValidateEqualsPure;
/**
 * @internal
 */
function createRandom() {
    halt("createRandom");
}
var createRandomPure = /** @__PURE__ */ Object.assign(createRandom, randomPure);
exports.createRandom = createRandomPure;
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=module.js.map