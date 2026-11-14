import { describe, it } from 'node:test';

import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';
import { expect } from 'chai';
import p from 'proxyquire';

type Register = (this: typeof recorder) => Promise<void>;

const labels: string[] = [];

const recorder = {
	async add(id: string, _value: unknown, options: { i18nLabel?: string; hidden?: boolean } = {}) {
		if (!options.hidden) {
			labels.push(options.i18nLabel ?? id);
		}
	},
	async section(_name: string, ...args: unknown[]) {
		await args.find((arg): arg is Register => typeof arg === 'function')?.call(recorder);
	},
};

const settingsRegistry = {
	add: recorder.add,
	async addGroup(_name: string, ...args: unknown[]) {
		await args.find((arg): arg is Register => typeof arg === 'function')?.call(recorder);
	},
};

const random = { '@rocket.chat/random': { Random: { id: () => 'id', secret: () => 'secret' } } };

const load = (path: string, stubs: Record<string, unknown> = {}) => p.noCallThru().load(path, { '.': { settingsRegistry }, ...stubs });

const { createOauthSettings } = load('./oauth', random);
const { createSlackBridgeSettings } = load('./slackbridge');
const { createGeneralSettings } = load('./general');
const { createAccountSettings } = load('./accounts', random);

(
	[
		['OAuth', createOauthSettings],
		['SlackBridge', createSlackBridgeSettings],
		['General', createGeneralSettings],
		['Accounts', createAccountSettings],
	] as const
).forEach(([group, createSettings]) => {
	describe(`${group} settings`, () => {
		it('should label every visible setting with a translation key that exists', async () => {
			labels.length = 0;
			await createSettings();

			expect(labels).to.have.length.above(0);
			expect(labels.filter((key) => !(key in en))).to.deep.equal([]);
		});
	});
});
