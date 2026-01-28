import fs from 'node:fs';
import path from 'node:path';

import { parse } from 'oxc-parser';

import { collectModuleExports } from './visit-export';

const exportCache = new Map<string, Promise<string[]>>();

export class MeteorResolver {
	private meteorProgramDir: string;

	private meteorPackagesDir: string;

	private meteorManifestPath: string;

	private fileCache = new Map<string, string>();

	constructor(meteorProgramDir: string) {
		this.meteorProgramDir = path.resolve(meteorProgramDir);
		this.meteorPackagesDir = path.join(this.meteorProgramDir, 'packages');
		this.meteorManifestPath = path.join(this.meteorProgramDir, 'program.json');
	}

	async getPackageSource(pkgName: string): Promise<string> {
		const packageFile = path.join(this.meteorPackagesDir, `${pkgName}.js`);
		if (this.fileCache.has(packageFile)) {
			return this.fileCache.get(packageFile) as string;
		}

		const code = await fs.promises.readFile(packageFile, 'utf-8');
		this.fileCache.set(packageFile, code);
		return code;
	}

	async getExportNames(pkgName: string): Promise<string[]> {
		const exportCacheEntry = exportCache.get(pkgName);
		if (exportCacheEntry) {
			return exportCacheEntry;
		}

		const promise = (async () => {
			const packageFile = path.join(this.meteorPackagesDir, `${pkgName}.js`);

			const code = await this.getPackageSource(pkgName);
			const ast = await parse(packageFile, code);
			const names = collectModuleExports(ast.program, pkgName);

			const sanitized = Array.from(names).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
			console.log(`[meteor-packages] exports for ${pkgName}:`, sanitized);
			return sanitized;
		})();

		exportCache.set(pkgName, promise);
		return promise;
	}

	collectPackageEntries() {
		const manifest: { manifest?: { where: string; type: string; path: string }[] } = JSON.parse(
			fs.readFileSync(this.meteorManifestPath, 'utf-8'),
		);
		const manifestEntries = manifest && Array.isArray(manifest.manifest) ? manifest.manifest : [];
		const fromManifest = manifestEntries.filter(
			(entry) => entry.where === 'client' && entry.type === 'js' && entry.path.startsWith('packages/'),
		);
		if (fromManifest.length > 0) {
			return fromManifest;
		}

		if (!fs.existsSync(this.meteorPackagesDir)) {
			console.warn(`[meteor-packages] Meteor client packages directory missing at ${this.meteorPackagesDir}`);
			return [];
		}

		const files = [];
		let dirEntries = [];
		try {
			dirEntries = fs.readdirSync(this.meteorPackagesDir, { withFileTypes: true });
		} catch (error) {
			console.warn(`[meteor-packages] Unable to read ${this.meteorPackagesDir}`, error);
			return [];
		}

		for (const entry of dirEntries) {
			if (!entry.isFile() || !entry.name.endsWith('.js')) {
				continue;
			}
			files.push({
				path: `packages/${entry.name}`,
				where: 'client',
				type: 'js',
			});
		}

		if (files.length === 0) {
			console.warn(
				`[meteor-packages] No individual package bundles found under ${this.meteorPackagesDir}. Run 'meteor run' once to regenerate development bundles before starting Vite.`,
			);
		}

		return files;
	}
}
