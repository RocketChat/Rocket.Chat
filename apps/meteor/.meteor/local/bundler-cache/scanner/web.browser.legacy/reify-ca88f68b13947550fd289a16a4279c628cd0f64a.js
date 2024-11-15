"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormTitle = exports.FormSubtitle = exports.FormSteps = exports.FormFooter = exports.FormHeader = exports.FormContainer = exports.Form = void 0;
var Form_1 = __importDefault(require("./Form"));
exports.Form = Form_1.default;
var FormContainer_1 = __importDefault(require("./FormContainer"));
exports.FormContainer = FormContainer_1.default;
var FormFooter_1 = __importDefault(require("./FormFooter"));
exports.FormFooter = FormFooter_1.default;
var FormHeader_1 = __importDefault(require("./FormHeader"));
exports.FormHeader = FormHeader_1.default;
var FormSteps_1 = __importDefault(require("./FormSteps"));
exports.FormSteps = FormSteps_1.default;
var FormSubtitle_1 = __importDefault(require("./FormSubtitle"));
exports.FormSubtitle = FormSubtitle_1.default;
var FormTitle_1 = __importDefault(require("./FormTitle"));
exports.FormTitle = FormTitle_1.default;
exports.default = Object.assign(Form_1.default, {
    /**
     * @deprecated prefer using named imports
     * */
    Header: FormHeader_1.default,
    /**
     * @deprecated prefer using named imports
     * */
    Steps: FormSteps_1.default,
    /**
     * @deprecated prefer using named imports
     * */
    Title: FormTitle_1.default,
    /**
     * @deprecated prefer using named imports
     * */
    Subtitle: FormSubtitle_1.default,
    /**
     * @deprecated prefer using named imports
     * */
    Container: FormContainer_1.default,
    /**
     * @deprecated prefer using named imports
     * */
    Footer: FormFooter_1.default,
});
//# sourceMappingURL=index.js.map