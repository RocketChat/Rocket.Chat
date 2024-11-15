"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsContext = void 0;
const react_1 = require("react");
exports.SettingsContext = (0, react_1.createContext)({
    hasPrivateAccess: false,
    isLoading: false,
    querySetting: () => [() => () => undefined, () => undefined],
    querySettings: () => [() => () => undefined, () => []],
    dispatch: () => __awaiter(void 0, void 0, void 0, function* () { return undefined; }),
});
//# sourceMappingURL=SettingsContext.js.map