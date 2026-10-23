import { describe, it } from 'node:test';

import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';
import { expect } from 'chai';
import p from 'proxyquire';

type Register = (this: typeof recorder) => Promise<void>;

const descriptions: string[] = [];

const recorder = {
	async add(_id: string, _value: unknown, options: { i18nDescription?: string } = {}) {
		if (options.i18nDescription) {
			descriptions.push(options.i18nDescription);
		}
	},
	async section(_name: string, ...args: unknown[]) {
		await args.find((arg): arg is Register => typeof arg === 'function')?.call(recorder);
	},
};

const settingsRegistry = {
	async addGroup(_name: string, ...args: unknown[]) {
		await args.find((arg): arg is Register => typeof arg === 'function')?.call(recorder);
	},
};

const { createMessageSettings } = p.noCallThru().load('./message', {
	'.': { settingsRegistry },
	'../../lib/MessageTypes': { MessageTypesValues: [] },
});

const { createFileUploadSettings } = p.noCallThru().load('./file-upload', {
	'.': { settingsRegistry },
});

(
	[
		['Message', createMessageSettings],
		['FileUpload', createFileUploadSettings],
	] as const
).forEach(([group, createSettings]) => {
	describe(`${group} settings`, () => {
		it('should describe settings only with translation keys that exist', async () => {
			descriptions.length = 0;
			await createSettings();

			expect(descriptions).to.have.length.above(0);
			expect(descriptions.filter((key) => !(key in en))).to.deep.equal([]);
		});
	});
});
