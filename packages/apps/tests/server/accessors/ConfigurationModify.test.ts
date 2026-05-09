import * as assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';

import type { ISchedulerModify, IServerSettingsModify, ISlashCommandsModify } from '@rocket.chat/apps-engine/definition/accessors';

import { ConfigurationModify } from '../../../src/server/accessors';

describe('ConfigurationModify', () => {
	let ssm: IServerSettingsModify;
	let scm: ISlashCommandsModify;
	let scheduler: ISchedulerModify;

	beforeEach(() => {
		ssm = {} as IServerSettingsModify;
		scm = {} as ISlashCommandsModify;
		scheduler = {} as ISchedulerModify;
	});

	it('useConfigurationModify', () => {
		assert.doesNotThrow(() => new ConfigurationModify(ssm, scm, scheduler));

		const sm = new ConfigurationModify(ssm, scm, scheduler);
		assert.strictEqual(sm.serverSettings, ssm);
		assert.strictEqual(sm.slashCommands, scm);
		assert.strictEqual(sm.scheduler, scheduler);
	});
});
