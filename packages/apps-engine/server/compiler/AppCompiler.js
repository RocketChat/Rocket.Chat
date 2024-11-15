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
exports.AppCompiler = void 0;
const path = require("path");
const ProxiedApp_1 = require("../ProxiedApp");
class AppCompiler {
    normalizeStorageFiles(files) {
        const result = {};
        Object.entries(files).forEach(([name, content]) => {
            result[name.replace(/\$/g, '.')] = content;
        });
        return result;
    }
    toSandBox(manager, storage, packageResult) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof packageResult.files[path.normalize(storage.info.classFile)] === 'undefined') {
                throw new Error(`Invalid App package for "${storage.info.name}". Could not find the classFile (${storage.info.classFile}) file.`);
            }
            const runtime = yield manager.getRuntime().startRuntimeForApp(packageResult, storage);
            const app = new ProxiedApp_1.ProxiedApp(manager, storage, runtime);
            return app;
        });
    }
}
exports.AppCompiler = AppCompiler;
//# sourceMappingURL=AppCompiler.js.map