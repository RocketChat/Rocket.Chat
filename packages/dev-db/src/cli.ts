#!/usr/bin/env node

import { DEV_DB_COMMANDS } from './product-contract';
import { runLifecycleCommand, type LifecycleCommand, type LifecycleOptions } from './lifecycle';

const SEED_PROFILES = ['minimal', 'demo', 'integration'] as const;

const isSeedProfile = (value: string | undefined): value is NonNullable<LifecycleOptions['seedProfile']> => {
	if (!value) {
		return false;
	}

	return (SEED_PROFILES as readonly string[]).includes(value);
};

const isCommand = (value: string): value is LifecycleCommand => {
	return (DEV_DB_COMMANDS as readonly string[]).includes(value);
};

const parseArgs = (argv: string[]): { command: LifecycleCommand; options: LifecycleOptions } => {
	const [commandArg, ...rest] = argv;
	const command = commandArg || 'status';

	if (!isCommand(command)) {
		throw new Error(`Unknown command: ${command}`);
	}

	const options: LifecycleOptions = {};

	for (let index = 0; index < rest.length; index += 1) {
		const token = rest[index];
		const next = rest[index + 1];

		switch (token) {
			case '--json':
				options.outputMode = 'json';
				break;
			case '--text':
				options.outputMode = 'text';
				break;
			case '--policy':
				options.policy = next;
				index += 1;
				break;
			case '--backend':
				options.backend = next as LifecycleOptions['backend'];
				index += 1;
				break;
			case '--port':
				options.port = Number(next);
				index += 1;
				break;
			case '--replica-set-name':
				options.replicaSetName = next;
				index += 1;
				break;
			case '--replica-set-disabled':
				options.replicaSetEnabled = false;
				break;
			case '--seed':
				if (!isSeedProfile(next)) {
					throw new Error(`Invalid seed profile: ${next}. Expected one of: ${SEED_PROFILES.join(', ')}`);
				}

				options.seedProfile = next;
				index += 1;
				break;
			default:
				throw new Error(`Unknown option: ${token}`);
		}
	}

	return { command, options };
};

const main = async (): Promise<void> => {
	const { command, options } = parseArgs(process.argv.slice(2));
	const output = await runLifecycleCommand(command, options);
	process.stdout.write(`${output}\n`);
};

void main();
