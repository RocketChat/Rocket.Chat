import * as fs from 'fs';
import * as path from 'path';

import * as AdmZip from 'adm-zip';
import * as semver from 'semver';
import { v4 as uuidv4 } from 'uuid';

import { AppImplements } from '.';
import type { IAppInfo } from '../../definition/metadata/IAppInfo';
import { RequiredApiVersionError } from '../errors';
import type { IParseAppPackageResult } from './IParseAppPackageResult';

export class AppPackageParser {
    public static uuid4Regex = /^[0-9a-fA-f]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

    private allowedIconExts: Array<string> = ['.png', '.jpg', '.jpeg', '.gif'];

    private appsEngineVersion: string;

    constructor() {
        this.appsEngineVersion = this.getEngineVersion();
    }

    public async unpackageApp(appPackage: Buffer): Promise<IParseAppPackageResult> {
        const zip = new AdmZip(appPackage);
        const infoZip = zip.getEntry('app.json');
        let info: IAppInfo;

        if (infoZip && !infoZip.isDirectory) {
            try {
                info = JSON.parse(infoZip.getData().toString()) as IAppInfo;

                if (!AppPackageParser.uuid4Regex.test(info.id)) {
                    info.id = uuidv4();
                    console.warn(
                        'WARNING: We automatically generated a uuid v4 id for',
                        info.name,
                        'since it did not provide us an id. This is NOT',
                        'recommended as the same App can be installed several times.',
                    );
                }
            } catch (e) {
                throw new Error('Invalid App package. The "app.json" file is not valid json.');
            }
        } else {
            throw new Error('Invalid App package. No "app.json" file.');
        }

        info.classFile = info.classFile.replace('.ts', '.js');

        if (!semver.satisfies(this.appsEngineVersion, info.requiredApiVersion)) {
            throw new RequiredApiVersionError(info, this.appsEngineVersion);
        }

        // Load all of the TypeScript only files
        const files: { [s: string]: string } = {};

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

        const implemented = new AppImplements();

        if (Array.isArray(info.implements)) {
            info.implements.forEach((interfaceName) => implemented.doesImplement(interfaceName));
        }

        return {
            info,
            files,
            languageContent,
            implemented,
        };
    }

    private getLanguageContent(zip: AdmZip): { [key: string]: object } {
        const languageContent: { [key: string]: object } = {};

        zip.getEntries()
            .filter((entry) => !entry.isDirectory && entry.entryName.startsWith('i18n/') && entry.entryName.endsWith('.json'))
            .forEach((entry) => {
                const entrySplit = entry.entryName.split('/');
                const lang = entrySplit[entrySplit.length - 1].split('.')[0].toLowerCase();

                let content;
                try {
                    content = JSON.parse(entry.getData().toString());
                } catch (e) {
                    // Failed to parse it, maybe warn them? idk yet
                }

                languageContent[lang] = Object.assign(languageContent[lang] || {}, content);
            });

        return languageContent;
    }

    private getIconFile(zip: AdmZip, filePath: string): string {
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

    private getEngineVersion(): string {
        const devLocation = path.join(__dirname, '../../../package.json');
        const prodLocation = path.join(__dirname, '../../package.json');

        let info: { version: string };

        if (fs.existsSync(devLocation)) {
            info = JSON.parse(fs.readFileSync(devLocation, 'utf8'));
        } else if (fs.existsSync(prodLocation)) {
            info = JSON.parse(fs.readFileSync(prodLocation, 'utf8'));
        } else {
            throw new Error('Could not find the Apps TypeScript Definition Package Version!');
        }

        return info.version.replace(/^[^0-9]/, '').split('-')[0];
    }
}
