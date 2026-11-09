import * as path from 'node:path';

import type { AppManager } from '../../AppManager.js';
import type { IParseAppPackageResult } from '../../compiler/index.js';
import type { IAppStorageItem } from '../../storage/index.js';
import { BaseRuntimeSubprocessController, type ProcessConfiguration } from '../base/BaseRuntimeSubprocessController.js';
import { nodeRuntimeScript } from '../paths.cjs';

export class NodeRuntimeSubprocessController extends BaseRuntimeSubprocessController {
	private readonly nodeBin = 'node';

	private readonly scriptRuntimePath: string;

	constructor(manager: AppManager, appPackage: IParseAppPackageResult, storageItem: IAppStorageItem) {
		super('node', manager, appPackage, storageItem);

		this.scriptRuntimePath = nodeRuntimeScript;
	}

	protected buildProcessConfiguration(): ProcessConfiguration {
		const allowedDirs = [this.tempFilePath, path.resolve(path.dirname(this.scriptRuntimePath), '..', '..'), this.appsEnginePath];

		const args = [
			'--permission',
			...allowedDirs.map((dir) => `--allow-fs-read=${dir}`),
			this.scriptRuntimePath,
			'--subprocess',
			this.appPackage.info.id,
			'--spawnId',
			String(this.spawnId++),
		];

		// SECURITY: We control the command, the arguments and the script that will be executed.
		return {
			command: this.nodeBin,
			args,
			options: {
				env: {
					PATH: process.env.PATH,
				},
			},
		};
	}
}
