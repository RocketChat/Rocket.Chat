import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DenoConfigurationFileSchema } from './typings';
import type { AppManager } from '../../AppManager';
import type { IParseAppPackageResult } from '../../compiler';
import type { IAppStorageItem } from '../../storage';
import { BaseRuntimeSubprocessController, type ProcessConfiguration } from '../base/BaseRuntimeSubprocessController';

// Trying to access environment variables in Deno throws an error where in vm2 it simply returned `undefined`
// So here we define the allowed envvars to prevent the process (and the compatibility) from breaking
export const ALLOWED_ENVIRONMENT_VARIABLES = [
	'NODE_EXTRA_CA_CERTS', // Accessed by the `https` node module
];

function getDenoConfigPath(): string {
	return require.resolve('../../../../deno-runtime/deno.jsonc');
}

/**
 * Generates a runtime deno.jsonc at `<tempDir>/deno_runtime.jsonc` by reading
 * the static config and injecting the resolved absolute path for
 * `@rocket.chat/apps-engine/`. This makes deno-runtime location-independent:
 * the path is always correct regardless of where this package is installed.
 *
 * Returns the path to the generated config file.
 */
function generateEphemeralDenoConfig(targetPath: string, denoConfigPath: string, appsEnginePath: string): void {
	let staticConfig: DenoConfigurationFileSchema;

	try {
		staticConfig = JSON.parse(fs.readFileSync(denoConfigPath, 'utf8'));
	} catch {
		throw new Error(`Failed to read the static Deno config at "${denoConfigPath}"`);
	}

	const runtimeConfig = {
		...staticConfig,
		imports: {
			...staticConfig.imports,
			'@rocket.chat/apps-engine/': `${appsEnginePath}/`,
		},
	};

	fs.writeFileSync(targetPath, JSON.stringify(runtimeConfig, null, '\t'));
}

export class DenoRuntimeSubprocessController extends BaseRuntimeSubprocessController {
	private readonly denoBin = 'deno';

	private readonly denoRuntimePath: string;

	private readonly denoConfigPath: string;

	private readonly denoEphemeralConfigPath: string;

	private readonly denoDir: string;

	private readonly packagePath: string;

	constructor(manager: AppManager, appPackage: IParseAppPackageResult, storageItem: IAppStorageItem) {
		super('deno', manager, appPackage, storageItem);

		this.denoConfigPath = getDenoConfigPath();

		this.packagePath = path.join(path.dirname(this.denoConfigPath), '..');
		this.denoDir = process.env.DENO_DIR ?? path.join(this.packagePath, '.deno-cache');

		this.denoRuntimePath = path.join(this.tempFilePath, 'deno-runtime', 'main.ts');
		this.denoEphemeralConfigPath = this.denoConfigPath.replace('.jsonc', '.runtime.jsonc');

		/**
		 * Deno 2.x refuses to run scripts inside the node_modules, so we create a symlink to the deno runtime files in the temp directory
		 * The temp directory is the same we are given by the host to store temporary upload files
		 */
		try {
			fs.symlinkSync(path.dirname(this.denoConfigPath), path.dirname(this.denoRuntimePath), 'dir');
		} catch (reason: unknown) {
			if ((reason as NodeJS.ErrnoException).code !== 'EEXIST') {
				throw reason;
			}
		}

		// Generate a runtime config with the resolved absolute path for @rocket.chat/apps-engine/
		generateEphemeralDenoConfig(this.denoEphemeralConfigPath, this.denoConfigPath, this.appsEnginePath);
	}

	protected buildProcessConfiguration(): ProcessConfiguration {
		const allowedDirs = [this.tempFilePath, this.denoDir, this.packagePath, this.appsEnginePath];

		const args = [
			'run',
			'--cached-only',
			`--config=${this.denoEphemeralConfigPath}`,
			`--allow-read=${allowedDirs.join(',')}`,
			`--allow-env=${ALLOWED_ENVIRONMENT_VARIABLES.join(',')}`,
			this.denoRuntimePath,
			'--subprocess',
			this.appPackage.info.id,
			'--spawnId',
			String(this.spawnId++),
		];

		// If the app doesn't request any permissions, it gets the default set of permissions, which includes "networking"
		// If the app requests specific permissions, we need to check whether it requests "networking" or not
		if (this.appPackage.info.permissions?.findIndex((p) => p.name === 'networking') !== -1) {
			args.splice(1, 0, '--allow-net');
		}

		// SECURITY: We control the command, the arguments and the script that will be executed.
		return {
			command: this.denoBin,
			args,
			options: {
				env: {
					// We need to pass the PATH, otherwise the shell won't find the deno executable
					// But the runtime itself won't have access to the env var because of the parameters
					PATH: process.env.PATH,
					DENO_DIR: this.denoDir,
				},
			},
		};
	}
}
