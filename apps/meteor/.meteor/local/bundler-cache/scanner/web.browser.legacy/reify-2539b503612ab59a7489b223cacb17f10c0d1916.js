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
exports.createValidatePrune = exports.createIsPrune = exports.createAssertPrune = exports.createPrune = exports.createValidateClone = exports.createIsClone = exports.createAssertClone = exports.createClone = exports.validatePrune = exports.isPrune = exports.assertPrune = exports.prune = exports.validateClone = exports.isClone = exports.assertClone = exports.clone = void 0;
exports.literals = literals;
/* ===========================================================
    MISCELLAENOUS
      - LITERALS
      - CLONE
      - PRUNE
      - FACTORY FUNCTIONS
==============================================================
    LITERALS
----------------------------------------------------------- */
var Namespace = __importStar(require("./functional/Namespace"));
/**
 * @internal
 */
function literals() {
    halt("literals");
}
/**
 * @internal
 */
function clone() {
    halt("clone");
}
var clonePure = /** @__PURE__ */ Object.assign(clone, 
/** @__PURE__ */ Namespace.misc.clone("clone"));
exports.clone = clonePure;
/**
 * @internal
 */
function assertClone() {
    halt("assertClone");
}
var assertClonePure = /** @__PURE__ */ Object.assign(assertClone, 
/** @__PURE__ */ Namespace.assert("misc.assertClone"), 
/** @__PURE__ */ Namespace.misc.clone("assertClone"));
exports.assertClone = assertClonePure;
/**
 * @internal
 */
function isClone() {
    halt("isClone");
}
var isClonePure = /** @__PURE__ */ Object.assign(isClone, 
/** @__PURE__ */ Namespace.is(), 
/** @__PURE__ */ Namespace.misc.clone("isClone"));
exports.isClone = isClonePure;
/**
 * @internal
 */
function validateClone() {
    halt("validateClone");
}
var validateClonePure = /** @__PURE__ */ Object.assign(validateClone, 
/** @__PURE__ */ Namespace.validate(), 
/** @__PURE__ */ Namespace.misc.clone("validateClone"));
exports.validateClone = validateClonePure;
/**
 * @internal
 */
function prune() {
    halt("prune");
}
var prunePure = /** @__PURE__ */ Object.assign(prune, 
/** @__PURE__ */ Namespace.misc.prune("prune"));
exports.prune = prunePure;
/**
 * @internal
 */
function assertPrune() {
    halt("assertPrune");
}
var assertPrunePure = /** @__PURE__ */ Object.assign(assertPrune, 
/** @__PURE__ */ Namespace.assert("misc.assertPrune"), 
/** @__PURE__ */ Namespace.misc.prune("assertPrune"));
exports.assertPrune = assertPrunePure;
/**
 * @internal
 */
function isPrune() {
    halt("isPrune");
}
var isPrunePure = /** @__PURE__ */ Object.assign(isPrune, 
/** @__PURE__ */ Namespace.is(), 
/** @__PURE__ */ Namespace.misc.prune("isPrune"));
exports.isPrune = isPrunePure;
/**
 * @internal
 */
function validatePrune() {
    halt("validatePrune");
}
var validatePrunePure = /** @__PURE__ */ Object.assign(validatePrune, 
/** @__PURE__ */ Namespace.misc.prune("validatePrune"), 
/** @__PURE__ */ Namespace.validate());
exports.validatePrune = validatePrunePure;
/**
 * @internal
 */
function createClone() {
    halt("createClone");
}
var createClonePure = /** @__PURE__ */ Object.assign(createClone, clonePure);
exports.createClone = createClonePure;
/**
 * @internal
 */
function createAssertClone() {
    halt("createAssertClone");
}
var createAssertClonePure = /** @__PURE__ */ Object.assign(createAssertClone, assertClonePure);
exports.createAssertClone = createAssertClonePure;
/**
 * @internal
 */
function createIsClone() {
    halt("createIsClone");
}
var createIsClonePure = /** @__PURE__ */ Object.assign(createIsClone, isClonePure);
exports.createIsClone = createIsClonePure;
/**
 * @internal
 */
function createValidateClone() {
    halt("createValidateClone");
}
var createValidateClonePure = /** @__PURE__ */ Object.assign(createValidateClone, validateClonePure);
exports.createValidateClone = createValidateClonePure;
/**
 * @internal
 */
function createPrune() {
    halt("createPrune");
}
var createPrunePure = /** @__PURE__ */ Object.assign(createPrune, prunePure);
exports.createPrune = createPrunePure;
/**
 * @internal
 */
function createAssertPrune() {
    halt("createAssertPrune");
}
var createAssertPrunePure = /** @__PURE__ */ Object.assign(createAssertPrune, assertPrunePure);
exports.createAssertPrune = createAssertPrunePure;
/**
 * @internal
 */
function createIsPrune() {
    halt("createIsPrune");
}
var createIsPrunePure = /** @__PURE__ */ Object.assign(createIsPrune, isPrunePure);
exports.createIsPrune = createIsPrunePure;
/**
 * @internal
 */
function createValidatePrune() {
    halt("createValidatePrune");
}
var createValidatePrunePure = /** @__PURE__ */ Object.assign(createValidatePrune, validatePrunePure);
exports.createValidatePrune = createValidatePrunePure;
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.misc.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=misc.js.map