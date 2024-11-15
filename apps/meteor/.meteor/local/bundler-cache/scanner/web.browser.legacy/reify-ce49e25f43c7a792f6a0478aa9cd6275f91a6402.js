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
exports.createValidateEncode = exports.createAssertEncode = exports.createIsEncode = exports.createEncode = exports.createValidateDecode = exports.createAssertDecode = exports.createIsDecode = exports.createDecode = exports.validateEncode = exports.isEncode = exports.assertEncode = exports.encode = exports.validateDecode = exports.isDecode = exports.assertDecode = exports.decode = void 0;
exports.message = message;
var Namespace = __importStar(require("./functional/Namespace"));
/**
 * @internal
 */
function message() {
    halt("message");
}
/**
 * @internal
 */
function decode() {
    halt("decode");
}
var decodePure = /** @__PURE__ */ Object.assign(decode, 
/** @__PURE__ */ Namespace.protobuf.decode("decode"));
exports.decode = decodePure;
/**
 * @internal
 */
function assertDecode() {
    halt("assertDecode");
}
var assertDecodePure = /** @__PURE__ */ Object.assign(assertDecode, 
/** @__PURE__ */ Namespace.assert("protobuf.assertDecode"), 
/** @__PURE__ */ Namespace.protobuf.decode("assertDecode"));
exports.assertDecode = assertDecodePure;
/**
 * @internal
 */
function isDecode() {
    halt("isDecode");
}
var isDecodePure = /** @__PURE__ */ Object.assign(isDecode, 
/** @__PURE__ */ Namespace.is(), 
/** @__PURE__ */ Namespace.protobuf.decode("isDecode"));
exports.isDecode = isDecodePure;
/**
 * @internal
 */
function validateDecode() {
    halt("validateDecode");
}
var validateDecodePure = /** @__PURE__ */ Object.assign(validateDecode, 
/** @__PURE__ */ Namespace.validate(), 
/** @__PURE__ */ Namespace.protobuf.decode("validateDecode"));
exports.validateDecode = validateDecodePure;
/**
 * @internal
 */
function encode() {
    halt("encode");
}
var encodePure = /** @__PURE__ */ Object.assign(encode, 
/** @__PURE__ */ Namespace.protobuf.encode("encode"));
exports.encode = encodePure;
/**
 * @internal
 */
function assertEncode() {
    halt("assertEncode");
}
var assertEncodePure = /** @__PURE__ */ Object.assign(assertEncode, 
/** @__PURE__ */ Namespace.assert("protobuf.assertEncode"), 
/** @__PURE__ */ Namespace.protobuf.encode("assertEncode"));
exports.assertEncode = assertEncodePure;
/**
 * @internal
 */
function isEncode() {
    halt("isEncode");
}
var isEncodePure = /** @__PURE__ */ Object.assign(isEncode, 
/** @__PURE__ */ Namespace.is(), 
/** @__PURE__ */ Namespace.protobuf.encode("isEncode"));
exports.isEncode = isEncodePure;
/**
 * @internal
 */
function validateEncode() {
    halt("validateEncode");
}
var validateEncodePure = /** @__PURE__ */ Object.assign(validateEncode, 
/** @__PURE__ */ Namespace.validate(), 
/** @__PURE__ */ Namespace.protobuf.encode("validateEncode"));
exports.validateEncode = validateEncodePure;
/**
 * @internal
 */
function createDecode() {
    halt("createDecode");
}
var createDecodePure = /** @__PURE__ */ Object.assign(createDecode, /** @__PURE__ */ Namespace.protobuf.decode("createDecode"));
exports.createDecode = createDecodePure;
/**
 * @internal
 */
function createIsDecode() {
    halt("createIsDecode");
}
var createIsDecodePure = /** @__PURE__ */ Object.assign(createIsDecode, 
/** @__PURE__ */ Namespace.is(), 
/** @__PURE__ */ Namespace.protobuf.decode("createIsDecode"));
exports.createIsDecode = createIsDecodePure;
/**
 * @internal
 */
function createAssertDecode() {
    halt("createAssertDecode");
}
var createAssertDecodePure = /** @__PURE__ */ Object.assign(createAssertDecode, 
/** @__PURE__ */ Namespace.assert("protobuf.createAssertDecode"), 
/** @__PURE__ */ Namespace.protobuf.decode("createAssertDecode"));
exports.createAssertDecode = createAssertDecodePure;
/**
 * @internal
 */
function createValidateDecode() {
    halt("createValidateDecode");
}
var createValidateDecodePure = /** @__PURE__ */ Object.assign(createValidateDecode, 
/** @__PURE__ */ Namespace.validate(), 
/** @__PURE__ */ Namespace.protobuf.decode("createValidateDecode"));
exports.createValidateDecode = createValidateDecodePure;
/**
 * @internal
 */
function createEncode() {
    halt("createEncode");
}
var createEncodePure = /** @__PURE__ */ Object.assign(createEncode, /** @__PURE__ */ Namespace.protobuf.encode("createEncode"));
exports.createEncode = createEncodePure;
/**
 * @internal
 */
function createIsEncode() {
    halt("createIsEncode");
}
var createIsEncodePure = /** @__PURE__ */ Object.assign(createIsEncode, 
/** @__PURE__ */ Namespace.is(), 
/** @__PURE__ */ Namespace.protobuf.encode("createIsEncode"));
exports.createIsEncode = createIsEncodePure;
/**
 * @internal
 */
function createAssertEncode() {
    halt("createAssertEncode");
}
var createAssertEncodePure = /** @__PURE__ */ Object.assign(createAssertEncode, 
/** @__PURE__ */ Namespace.assert("protobuf.createAssertEncode"), 
/** @__PURE__ */ Namespace.protobuf.encode("createAssertEncode"));
exports.createAssertEncode = createAssertEncodePure;
/**
 * @internal
 */
function createValidateEncode() {
    halt("createValidateEncode");
}
var createValidateEncodePure = /** @__PURE__ */ Object.assign(createValidateEncode, 
/** @__PURE__ */ Namespace.validate(), 
/** @__PURE__ */ Namespace.protobuf.encode("createValidateEncode"));
exports.createValidateEncode = createValidateEncodePure;
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.protobuf.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=protobuf.js.map