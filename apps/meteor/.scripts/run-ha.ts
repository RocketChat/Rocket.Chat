import type { SpawnOptions } from 'child_process';
import { spawn } from 'child_process';
import * as path from 'path';

enum ModeParam {
	MAIN = 'main',
	INSTANCE = 'instance',
}

interface IConfig extends SpawnOptions {
	customEnv: typeof process.env;
	parentEnv: typeof process.env;
}

function isMode(value: any): value is ModeParam {
	return Object.values(ModeParam).includes(value);
}

function buildConfig(cwd: string): IConfig {
	const customEnv: IConfig['customEnv'] = {
		OVERWRITE_SETTING_Cloud_Url: 'https://my.staging.cloud.rocket.chat',
		INSTANCE_IP: '127.0.0.1',
		MONGO_URL: 'mongodb://localhost:3001/meteor',
		MONGO_OPLOG_URL: 'mongodb://localhost:3001/local',
		REG_TOKEN: '',
	};

	return {
		cwd,
		stdio: 'inherit',
		shell: true,
		customEnv,
		parentEnv: process.env,
		env: {
			...customEnv,
			...process.env,
		},
	};
}

async function runMain(config: IConfig): Promise<void> {
	const {
		customEnv: { INSTANCE_IP },
		parentEnv,
		...mainConfig
	} = config;

	const spawnConfig = {
		...mainConfig,
		env: {
			INSTANCE_IP,
			...parentEnv,
		},
	};

	spawn('meteor', spawnConfig);
}

async function runInstance(config: IConfig, instance: any): Promise<void> {
	// Desctructuring the unused variables allows us to omit them in the `mainConfig`
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { customEnv, parentEnv, ...mainConfig } = config;

	const env = {
		PORT: `303${instance}`,
		ROOT_URL: '',
		...mainConfig.env,
	};

	env.ROOT_URL = `http://localhost:${env.PORT}`;

	const spawnConfig = {
		...mainConfig,
		env,
	};

	spawn('node', ['.meteor/local/build/main.js'], spawnConfig);
}

async function main(mode: any, instance: any): Promise<void> {
	if (!isMode(mode)) {
		mode = 'main';
	}

	const config = buildConfig(path.resolve(__dirname, '..'));

	switch (mode) {
		case ModeParam.MAIN:
			runMain(config);
			break;
		case ModeParam.INSTANCE:
			runInstance(config, instance);
			break;
	}
}

// First two parameters are the executable and the path to this script
const [, , mode, instance] = process.argv;

main(mode, instance);
