type ConfigOptions = {
	https?: boolean;
	simulateUploadSpeed?: number;
	storesPath?: string;
	tmpDir?: string;
	tmpDirPermissions?: string;
};

type RequiredConfigOptions = Required<ConfigOptions>;

export class Config {
	public https: RequiredConfigOptions['https'];

	public simulateUploadSpeed: RequiredConfigOptions['simulateUploadSpeed'];

	public storesPath: RequiredConfigOptions['storesPath'];

	public tmpDir: RequiredConfigOptions['tmpDir'];

	public tmpDirPermissions: RequiredConfigOptions['tmpDirPermissions'];

	constructor(options: ConfigOptions = {}) {
		// Default options
		options = {
			https: false,
			simulateUploadSpeed: 0,
			storesPath: 'ufs',
			tmpDir: '/tmp/ufs',
			tmpDirPermissions: '0700',
			...options,
		};

		// Check options
		if (typeof options.https !== 'boolean') {
			throw new TypeError('Config: https is not a function');
		}
		if (typeof options.simulateUploadSpeed !== 'number') {
			throw new TypeError('Config: simulateUploadSpeed is not a number');
		}
		if (typeof options.storesPath !== 'string') {
			throw new TypeError('Config: storesPath is not a string');
		}
		if (typeof options.tmpDir !== 'string') {
			throw new TypeError('Config: tmpDir is not a string');
		}
		if (typeof options.tmpDirPermissions !== 'string') {
			throw new TypeError('Config: tmpDirPermissions is not a string');
		}

		this.https = options.https;
		this.simulateUploadSpeed = options.simulateUploadSpeed;
		this.storesPath = options.storesPath;
		this.tmpDir = options.tmpDir;
		this.tmpDirPermissions = options.tmpDirPermissions;
	}
}
