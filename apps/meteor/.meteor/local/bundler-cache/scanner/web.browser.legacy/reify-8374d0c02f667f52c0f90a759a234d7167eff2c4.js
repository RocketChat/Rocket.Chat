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
exports.createParameter = exports.createValidateHeaders = exports.createIsHeaders = exports.createAssertHeaders = exports.createHeaders = exports.createValidateQuery = exports.createIsQuery = exports.createAssertQuery = exports.createQuery = exports.createValidateFormData = exports.createIsFormData = exports.createAssertFormData = exports.createFormData = exports.parameter = exports.validateHeaders = exports.isHeaders = exports.assertHeaders = exports.headers = exports.validateQuery = exports.isQuery = exports.assertQuery = exports.query = exports.validateFormData = exports.isFormData = exports.assertFormData = exports.formData = void 0;
var Namespace = __importStar(require("./functional/Namespace"));
/**
 * @internal
 */
function formData() {
    halt("formData");
}
var formDataPure = /** @__PURE__ */ Object.assign(formData, 
/** @__PURE__ */ Namespace.http.formData());
exports.formData = formDataPure;
/**
 * @internal
 */
function assertFormData() {
    halt("assertFormData");
}
var assertFormDataPure = /** @__PURE__ */ Object.assign(assertFormData, 
/** @__PURE__ */ Namespace.http.formData(), 
/** @__PURE__ */ Namespace.assert("http.assertFormData"));
exports.assertFormData = assertFormDataPure;
/**
 * @internal
 */
function isFormData() {
    halt("isFormData");
}
var isFormDataPure = /** @__PURE__ */ Object.assign(isFormData, 
/** @__PURE__ */ Namespace.http.formData(), 
/** @__PURE__ */ Namespace.is());
exports.isFormData = isFormDataPure;
/**
 * @internal
 */
function validateFormData() {
    halt("validateFormData");
}
var validateFormDataPure = /** @__PURE__ */ Object.assign(validateFormData, 
/** @__PURE__ */ Namespace.http.formData(), 
/** @__PURE__ */ Namespace.validate());
exports.validateFormData = validateFormDataPure;
/**
 * @internal
 */
function query() {
    halt("query");
}
var queryPure = /** @__PURE__ */ Object.assign(query, 
/** @__PURE__ */ Namespace.http.query());
exports.query = queryPure;
/**
 * @internal
 */
function assertQuery() {
    halt("assertQuery");
}
var assertQueryPure = /** @__PURE__ */ Object.assign(assertQuery, 
/** @__PURE__ */ Namespace.http.query(), 
/** @__PURE__ */ Namespace.assert("http.assertQuery"));
exports.assertQuery = assertQueryPure;
/**
 * @internal
 */
function isQuery() {
    halt("isQuery");
}
var isQueryPure = /** @__PURE__ */ Object.assign(isQuery, 
/** @__PURE__ */ Namespace.http.query(), 
/** @__PURE__ */ Namespace.is());
exports.isQuery = isQueryPure;
/**
 * @internal
 */
function validateQuery() {
    halt("validateQuery");
}
var validateQueryPure = /** @__PURE__ */ Object.assign(validateQuery, 
/** @__PURE__ */ Namespace.http.query(), 
/** @__PURE__ */ Namespace.validate());
exports.validateQuery = validateQueryPure;
/**
 * @internal
 */
function headers() {
    halt("headers");
}
var headersPure = /** @__PURE__ */ Object.assign(headers, 
/** @__PURE__ */ Namespace.http.headers());
exports.headers = headersPure;
/**
 * @internal
 */
function assertHeaders() {
    halt("assertHeaders");
}
var assertHeadersPure = /** @__PURE__ */ Object.assign(assertHeaders, 
/** @__PURE__ */ Namespace.http.headers(), 
/** @__PURE__ */ Namespace.assert("http.assertHeaders"));
exports.assertHeaders = assertHeadersPure;
/**
 * @internal
 */
function isHeaders() {
    halt("isHeaders");
}
var isHeadersPure = /** @__PURE__ */ Object.assign(isHeaders, 
/** @__PURE__ */ Namespace.http.headers(), 
/** @__PURE__ */ Namespace.is());
exports.isHeaders = isHeadersPure;
/**
 * @internal
 */
function validateHeaders() {
    halt("validateHeaders");
}
var validateHeadersPure = /** @__PURE__ */ Object.assign(validateHeaders, 
/** @__PURE__ */ Namespace.http.headers(), 
/** @__PURE__ */ Namespace.validate());
exports.validateHeaders = validateHeadersPure;
/**
 * @internal
 */
function parameter() {
    halt("parameter");
}
var parameterPure = /** @__PURE__ */ Object.assign(parameter, 
/** @__PURE__ */ Namespace.http.parameter(), 
/** @__PURE__ */ Namespace.assert("http.parameter"));
exports.parameter = parameterPure;
/**
 * @internal
 */
function createFormData() {
    halt("createFormData");
}
var createFormDataPure = /** @__PURE__ */ Object.assign(createFormData, /** @__PURE__ */ Namespace.http.formData());
exports.createFormData = createFormDataPure;
/**
 * @internal
 */
function createAssertFormData() {
    halt("createAssertFormData");
}
var createAssertFormDataPure = /** @__PURE__ */ Object.assign(createAssertFormData, 
/** @__PURE__ */ Namespace.http.formData(), 
/** @__PURE__ */ Namespace.assert("http.createAssertFormData"));
exports.createAssertFormData = createAssertFormDataPure;
/**
 * @internal
 */
function createIsFormData() {
    halt("createIsFormData");
}
var createIsFormDataPure = /** @__PURE__ */ Object.assign(createIsFormData, 
/** @__PURE__ */ Namespace.http.formData(), 
/** @__PURE__ */ Namespace.is());
exports.createIsFormData = createIsFormDataPure;
/**
 * @internal
 */
function createValidateFormData() {
    halt("createValidateFormData");
}
var createValidateFormDataPure = /** @__PURE__ */ Object.assign(createValidateFormData, 
/** @__PURE__ */ Namespace.http.formData(), 
/** @__PURE__ */ Namespace.validate());
exports.createValidateFormData = createValidateFormDataPure;
/**
 * @internal
 */
function createQuery() {
    halt("createQuery");
}
var createQueryPure = /** @__PURE__ */ Object.assign(createQuery, 
/** @__PURE__ */ Namespace.http.query());
exports.createQuery = createQueryPure;
/**
 * @internal
 */
function createAssertQuery() {
    halt("createAssertQuery");
}
var createAssertQueryPure = /** @__PURE__ */ Object.assign(createAssertQuery, 
/** @__PURE__ */ Namespace.http.query(), 
/** @__PURE__ */ Namespace.assert("http.createAssertQuery"));
exports.createAssertQuery = createAssertQueryPure;
/**
 * @internal
 */
function createIsQuery() {
    halt("createIsQuery");
}
var createIsQueryPure = /** @__PURE__ */ Object.assign(createIsQuery, 
/** @__PURE__ */ Namespace.http.query(), 
/** @__PURE__ */ Namespace.is());
exports.createIsQuery = createIsQueryPure;
/**
 * @internal
 */
function createValidateQuery() {
    halt("createValidateQuery");
}
var createValidateQueryPure = /** @__PURE__ */ Object.assign(createValidateQuery, 
/** @__PURE__ */ Namespace.http.query(), 
/** @__PURE__ */ Namespace.validate());
exports.createValidateQuery = createValidateQueryPure;
/**
 * @internal
 */
function createHeaders() {
    halt("createHeaders");
}
var createHeadersPure = /** @__PURE__ */ Object.assign(createHeaders, /** @__PURE__ */ Namespace.http.headers());
exports.createHeaders = createHeadersPure;
/**
 * @internal
 */
function createAssertHeaders() {
    halt("createAssertHeaders");
}
var createAssertHeadersPure = /** @__PURE__ */ Object.assign(createAssertHeaders, 
/** @__PURE__ */ Namespace.http.headers(), 
/** @__PURE__ */ Namespace.assert("http.createAssertHeaders"));
exports.createAssertHeaders = createAssertHeadersPure;
/**
 * @internal
 */
function createIsHeaders() {
    halt("createIsHeaders");
}
var createIsHeadersPure = /** @__PURE__ */ Object.assign(createIsHeaders, 
/** @__PURE__ */ Namespace.http.headers(), 
/** @__PURE__ */ Namespace.is());
exports.createIsHeaders = createIsHeadersPure;
/**
 * @internal
 */
function createValidateHeaders() {
    halt("createValidateHeaders");
}
var createValidateHeadersPure = /** @__PURE__ */ Object.assign(createValidateHeaders, 
/** @__PURE__ */ Namespace.http.headers(), 
/** @__PURE__ */ Namespace.validate());
exports.createValidateHeaders = createValidateHeadersPure;
/**
 * @internal
 */
function createParameter() {
    halt("createParameter");
}
var createParameterPure = /** @__PURE__ */ Object.assign(createParameter, 
/** @__PURE__ */ Namespace.http.parameter(), 
/** @__PURE__ */ Namespace.assert("http.createParameter"));
exports.createParameter = createParameterPure;
/**
 * @internal
 */
function halt(name) {
    throw new Error("Error on typia.http.".concat(name, "(): no transform has been configured. Read and follow https://typia.io/docs/setup please."));
}
//# sourceMappingURL=http.js.map