"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Form_1 = __importDefault(require("./Form"));
var FormContainer_1 = __importDefault(require("./FormContainer"));
var FormFooter_1 = __importDefault(require("./FormFooter"));
var FormSteps_1 = __importDefault(require("./FormSteps"));
var FormSubtitle_1 = __importDefault(require("./FormSubtitle"));
var FormTitle_1 = __importDefault(require("./FormTitle"));
exports.default = Object.assign(Form_1.default, {
    Steps: FormSteps_1.default,
    Title: FormTitle_1.default,
    Subtitle: FormSubtitle_1.default,
    Container: FormContainer_1.default,
    Footer: FormFooter_1.default,
});
//# sourceMappingURL=index.js.map