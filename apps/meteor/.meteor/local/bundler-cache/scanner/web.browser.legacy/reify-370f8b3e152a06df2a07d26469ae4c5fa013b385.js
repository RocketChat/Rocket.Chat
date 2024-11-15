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
exports.AuthenticationContext = void 0;
const react_1 = require("react");
exports.AuthenticationContext = (0, react_1.createContext)({
    loginWithService: () => () => Promise.reject('loginWithService not implemented'),
    loginWithPassword: () => __awaiter(void 0, void 0, void 0, function* () { return Promise.reject('loginWithPassword not implemented'); }),
    loginWithToken: () => __awaiter(void 0, void 0, void 0, function* () { return Promise.reject('loginWithToken not implemented'); }),
    queryLoginServices: {
        getCurrentValue: () => [],
        subscribe: (_) => () => Promise.reject('queryLoginServices not implemented'),
    },
});
//# sourceMappingURL=AuthenticationContext.js.map