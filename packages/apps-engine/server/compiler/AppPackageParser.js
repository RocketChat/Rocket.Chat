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
exports.AppPackageParser = void 0;
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const semver = require("semver");
const uuid_1 = require("uuid");
const _1 = require(".");
const errors_1 = require("../errors");
class AppPackageParser {
    constructor() {
        this.allowedIconExts = ['.png', '.jpg', '.jpeg', '.gif'];
        this.appsEngineVersion = this.getEngineVersion();
    }
    unpackageApp(appPackage) {
        return __awaiter(this, void 0, void 0, function* () {
            const zip = new AdmZip(appPackage);
            const infoZip = zip.getEntry('app.json');
            let info;
            if (infoZip && !infoZip.isDirectory) {
                try {
                    info = JSON.parse(infoZip.getData().toString());
                    if (!AppPackageParser.uuid4Regex.test(info.id)) {
                        info.id = (0, uuid_1.v4)();
                        console.warn('WARNING: We automatically generated a uuid v4 id for', info.name, 'since it did not provide us an id. This is NOT', 'recommended as the same App can be installed several times.');
                    }
                }
                catch (e) {
                    throw new Error('Invalid App package. The "app.json" file is not valid json.');
                }
            }
            else {
                throw new Error('Invalid App package. No "app.json" file.');
            }
            info.classFile = info.classFile.replace('.ts', '.js');
            if (!semver.satisfies(this.appsEngineVersion, info.requiredApiVersion)) {
                throw new errors_1.RequiredApiVersionError(info, this.appsEngineVersion);
            }
            // Load all of the TypeScript only files
            const files = {};
            zip.getEntries()
                .filter((entry) => !entry.isDirectory && entry.entryName.endsWith('.js'))
                .forEach((entry) => {
                const norm = path.normalize(entry.entryName);
                // Files which start with `.` are supposed to be hidden
                if (norm.startsWith('.')) {
                    return;
                }
                files[norm] = entry.getData().toString();
            });
            // Ensure that the main class file exists
            if (!files[path.normalize(info.classFile)]) {
                throw new Error(`Invalid App package. Could not find the classFile (${info.classFile}) file.`);
            }
            const languageContent = this.getLanguageContent(zip);
            // Get the icon's content
            const iconFile = this.getIconFile(zip, info.iconFile);
            if (iconFile) {
                info.iconFileContent = iconFile;
            }
            const implemented = new _1.AppImplements();
            if (Array.isArray(info.implements)) {
                info.implements.forEach((interfaceName) => implemented.doesImplement(interfaceName));
            }
            return {
                info,
                files,
                languageContent,
                implemented,
            };
        });
    }
    getLanguageContent(zip) {
        const languageContent = {};
        zip.getEntries()
            .filter((entry) => !entry.isDirectory && entry.entryName.startsWith('i18n/') && entry.entryName.endsWith('.json'))
            .forEach((entry) => {
            const entrySplit = entry.entryName.split('/');
            const lang = entrySplit[entrySplit.length - 1].split('.')[0].toLowerCase();
            let content;
            try {
                content = JSON.parse(entry.getData().toString());
            }
            catch (e) {
                // Failed to parse it, maybe warn them? idk yet
            }
            languageContent[lang] = Object.assign(languageContent[lang] || {}, content);
        });
        return languageContent;
    }
    getIconFile(zip, filePath) {
        if (!filePath) {
            return undefined;
        }
        const ext = path.extname(filePath);
        if (!this.allowedIconExts.includes(ext)) {
            return undefined;
        }
        const entry = zip.getEntry(filePath);
        if (!entry) {
            return undefined;
        }
        if (entry.isDirectory) {
            return undefined;
        }
        const base64 = entry.getData().toString('base64');
        return `data:image/${ext.replace('.', '')};base64,${base64}`;
    }
    getEngineVersion() {
        const devLocation = path.join(__dirname, '../../../package.json');
        const prodLocation = path.join(__dirname, '../../package.json');
        let info;
        if (fs.existsSync(devLocation)) {
            info = JSON.parse(fs.readFileSync(devLocation, 'utf8'));
        }
        else if (fs.existsSync(prodLocation)) {
            info = JSON.parse(fs.readFileSync(prodLocation, 'utf8'));
        }
        else {
            throw new Error('Could not find the Apps TypeScript Definition Package Version!');
        }
        return info.version.replace(/^[^0-9]/, '').split('-')[0];
    }
}
exports.AppPackageParser = AppPackageParser;
AppPackageParser.uuid4Regex = /^[0-9a-fA-f]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
//# sourceMappingURL=AppPackageParser.js.map