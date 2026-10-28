import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata/IAppInfo';
import { version } from '@rocket.chat/apps-engine/package.json';
import AdmZip from 'adm-zip';
import * as semver from 'semver';

import { AppImplements } from '.';
import type { IParseAppPackageResult } from './IParseAppPackageResult';
import { RequiredApiVersionError } from '../errors';

export class AppPackageParser {
	public static uuid4Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

	private allowedIconExts: Array<string> = ['.png', '.jpg', '.jpeg', '.gif'];

	private readonly appsEngineVersion: string;

	constructor() {
		[this.appsEngineVersion] = version.split('-'); // In case there is a suffix like -dev, -rc.0, etc. We just want the version number for semver comparison
	}

	public async unpackageApp(appPackage: Buffer): Promise<IParseAppPackageResult> {
		const zip = new AdmZip(appPackage);
		const infoZip = zip.getEntry('app.json');
		let info: IAppInfo;

		if (infoZip && !infoZip.isDirectory) {
			try {
				info = JSON.parse(infoZip.getData().toString()) as IAppInfo;

				if (!AppPackageParser.uuid4Regex.test(info.id)) {
					info.id = randomUUID();
					console.warn(
						'WARNING: We automatically generated a uuid v4 id for',
						info.name,
						'since it did not provide us an id. This is NOT',
						'recommended as the same App can be installed several times.',
					);
				}
			} catch {
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

		zip
			.getEntries()
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
			info.implements.forEach((interfaceName) => implemented.setImplements(interfaceName));
		}

		return {
			info,
			files,
			languageContent,
			implemented,
		};
	}

	private getLanguageContent(zip: AdmZip): { [key: string]: object } {
		const languageContent: { [key: string]: object } = Object.create(null);

		zip
			.getEntries()
			.filter((entry) => !entry.isDirectory && entry.entryName.startsWith('i18n/') && entry.entryName.endsWith('.json'))
			.forEach((entry) => {
				const entrySplit = entry.entryName.split('/');
				const lang = entrySplit[entrySplit.length - 1].split('.')[0].toLowerCase();

				let content;
				try {
					content = JSON.parse(entry.getData().toString());
				} catch {
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
}
