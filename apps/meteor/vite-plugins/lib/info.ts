import { exec } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify} from 'node:util';

const execAsync = promisify(exec);

export async function loadInfo() {
	const info = await getInfo();
	return `export const Info = ${JSON.stringify(info.api, null, 4)};
export const minimumClientVersions = ${JSON.stringify(info.minimumClientVersions, null, 4)};`;
}

export async function loadSupportedVersionsInfo() {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const appDir = path.resolve(__dirname, '../..');
	const packageJsonPath = path.resolve(appDir, 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
	
	const supportedVersions = packageJson.rocketchat?.supportedVersions || {};

	return `export const supportedVersions = ${JSON.stringify(supportedVersions, null, 4)};`;
}

async function getInfo() {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const appDir = path.resolve(__dirname, '../..');
	const packageJsonPath = path.resolve(appDir, 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
	
	const appsEngineVersion = await getAppsEngineVersion(appDir);

	const output: {
		version: string;
		build: {
			date: string;
			nodeVersion: string;
			arch: NodeJS.Architecture;
			platform: NodeJS.Platform;
			osRelease: string;
			totalMemory: number;
			freeMemory: number;
			cpus: number;
		};
		marketplaceApiVersion: string;
		commit?: {
			hash?: string;
			tag?: string;
			branch?: string;
			date?: string;
			author?: string;
			subject?: string;
		};
	} = {
		version: packageJson.version,
		build: {
			date: new Date().toISOString(),
			nodeVersion: process.version,
			arch: process.arch,
			platform: process.platform,
			osRelease: os.release(),
			totalMemory: os.totalmem(),
			freeMemory: os.freemem(),
			cpus: os.cpus().length,
		},
		marketplaceApiVersion: appsEngineVersion.replace(/^[^0-9]/g, ''),
	};

	try {
		const result = await execAsync("git log --pretty=format:'%H%n%ad%n%an%n%s' -n 1");
		const data = result.stdout.split('\n');
		output.commit = {
			hash: data.shift(),
			date: data.shift(),
			author: data.shift(),
			subject: data.join('\n'),
		};
	} catch (e) {
		console.warn('Failed to get git info', e);
	}

	try {
		const tags = await execAsync('git describe --abbrev=0 --tags');
		if (output.commit) {
			output.commit.tag = tags.stdout.trim();
		}
	} catch (e) {
		// no tags
	}

	try {
		const branch = await execAsync('git rev-parse --abbrev-ref HEAD');
		if (output.commit) {
			output.commit.branch = branch.stdout.trim();
		}
	} catch (e) {
		// no branch
	}

	return {
		api: output,
		minimumClientVersions: packageJson.rocketchat?.minimumClientVersions || {},
	};
}

async function getAppsEngineVersion(appDir: string) {
	try {
		// Try to find it in node_modules
		const appsEnginePkgPath = path.resolve(appDir, 'node_modules/@rocket.chat/apps-engine/package.json');
		if (fs.existsSync(appsEnginePkgPath)) {
			const pkg = JSON.parse(fs.readFileSync(appsEnginePkgPath, 'utf-8'));
			return pkg.version;
		}
		
		// Fallback to searching in the workspace if possible (not guaranteed in all envs but likely in this monorepo)
		// Assuming standard monorepo structure ../../packages/apps-engine
		const localPath = path.resolve(appDir, '../../packages/apps-engine/package.json');
		if (fs.existsSync(localPath)) {
			const pkg = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
			return pkg.version;
		}

	} catch (e) {
		console.warn('Failed to resolve @rocket.chat/apps-engine version', e);
	}
	return '1.0.0'; // Fallback
}