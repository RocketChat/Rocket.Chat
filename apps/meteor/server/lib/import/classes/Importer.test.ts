import { before, beforeEach, describe, it } from 'node:test';

import type { IImport, IImportChannel, IImportRecord, IImportUser, IImporterShortSelection } from '@rocket.chat/core-typings';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { ImporterSelection } from './ImporterSelection';
import { SelectionChannel } from './ImporterSelectionChannel';
import { SelectionUser } from './ImporterSelectionUser';
import { RecordConverter } from './converters/RecordConverter';
import { ProgressStep } from '../../../../lib/importer/ImporterProgressStep';
import { loadWithMocks } from '../../../../tests/mocks/utils/loadWithMocks';

let imported: string[];
let onRecordImported: (id: string) => void;

const fakeConverter = (dataType: IImportRecord['dataType']) =>
	class extends RecordConverter<IImportRecord> {
		protected override getDataType() {
			return dataType;
		}

		protected override async convertRecord({ data }: IImportRecord) {
			const id = 'importIds' in data ? data.importIds[0] : data.msg;
			imported.push(id);
			onRecordImported(id);
			return true;
		}

		async convertChannels(_startedByUserId: string, callbacks: Parameters<RecordConverter<IImportRecord>['convertData']>[0]) {
			return this.convertData(callbacks);
		}
	};

const { ImportDataConverter } = loadWithMocks('./ImportDataConverter', {
	'./converters/UserConverter': { UserConverter: fakeConverter('user') },
	'./converters/ContactConverter': { ContactConverter: fakeConverter('contact') },
	'./converters/RoomConverter': { RoomConverter: fakeConverter('channel') },
	'./converters/MessageConverter': { MessageConverter: fakeConverter('message') },
});

const { Importer } = loadWithMocks('./Importer', {
	'./ImportDataConverter': { ImportDataConverter },
	'./ImporterWebsocket': { ImporterWebsocket: { progressUpdated: () => undefined } },
	'../../notifyListener': { notifyOnSettingChanged: () => undefined, notifyOnSettingChangedById: () => undefined },
	'../index': { Selection: ImporterSelection, SelectionChannel, SelectionUser },
});

let importRecord: IImport;
let settings: Map<string, unknown>;
const incrementValueById = sinon.stub();
const checkIfDirectMessagesExists = sinon.stub();

const user = (id: string): IImportUser => ({ importIds: [id], emails: [], username: id, type: 'user', roles: ['user'] });
const channel = (id: string, t: IImportChannel['t'] = 'c'): IImportChannel => ({ importIds: [id], name: id, t, users: [] });

const createImporter = async ({ users = [], channels = [] }: { users?: IImportUser[]; channels?: IImportChannel[] }) => {
	const importer = new Importer({ key: 'test', name: 'Test', importer: Importer }, importRecord, { workInMemory: true });
	for await (const data of users) {
		await importer.converter.addUser(data);
	}
	for await (const data of channels) {
		await importer.converter.addChannel(data);
	}
	for await (const msg of ['hello', 'bye']) {
		await importer.converter.addMessage({ msg, rid: 'general', u: { _id: 'alice' }, ts: new Date() });
	}
	return importer;
};

const runImport = async (importer: InstanceType<typeof Importer>, selection: IImporterShortSelection) => {
	await importer.startImport(selection, 'admin');
	await new Promise((resolve) => setImmediate(resolve));
};

describe('Importer', () => {
	before(() => {
		mockModel('Settings', {
			findOneById: async (_id: string) => (settings.has(_id) ? { _id, value: settings.get(_id) } : null),
			updateValueById: async (_id: string, value: unknown) => {
				settings.set(_id, value);
				return { modifiedCount: 1 };
			},
			incrementValueById,
		});
		mockModel('Imports', {
			update: async () => undefined,
			findOne: async () => importRecord,
		});
		mockModel('ImportData', {
			getAllUsersForSelection: async () => [],
			getAllChannelsForSelection: async () => [{ data: channel('general') }],
			getAllContactsForSelection: async () => [],
			checkIfDirectMessagesExists,
			countMessages: async () => 1,
		});
	});

	beforeEach(() => {
		imported = [];
		onRecordImported = () => undefined;
		importRecord = { _id: 'import-id', importerKey: 'test', status: ProgressStep.USER_SELECTION, valid: true } as IImport;
		settings = new Map<string, unknown>([
			['Accounts_AllowUsernameChange', false],
			['FileUpload_MaxFileSize', 0],
			['FileUpload_MediaTypeWhiteList', ''],
			['FileUpload_MediaTypeBlackList', 'text/html'],
		]);
		incrementValueById.reset();
		checkIfDirectMessagesExists.reset();
	});

	[
		{ channels: { all: true }, expected: ['general', 'random', 'dm'] },
		{ channels: { all: false, list: [] }, expected: [] },
		{ channels: { all: false, list: ['general', '__directMessages__'] }, expected: ['general', 'dm'] },
	].forEach(({ channels, expected }) => {
		it(`should import only the selected channels when the selection is ${JSON.stringify(channels)}`, async () => {
			const importer = await createImporter({ channels: [channel('general'), channel('random'), channel('dm', 'd')] });

			await runImport(importer, { users: { all: true }, channels });

			const importedChannels = imported.filter((id) => ['general', 'random', 'dm'].includes(id));
			expect(importedChannels).to.deep.equal(expected);
		});
	});

	[
		{ step: 'users', replacedAt: 'alice', expected: ['alice'] },
		{ step: 'messages', replacedAt: 'hello', expected: ['alice', 'general', 'hello'] },
	].forEach(({ step, replacedAt, expected }) => {
		it(`should import no more records after a new import replaces the running one during its ${step} step`, async () => {
			importRecord = { ...importRecord, count: { total: 4, completed: 0, error: 0 } };
			const importer = await createImporter({ users: [user('alice')], channels: [channel('general')] });
			onRecordImported = (id) => {
				if (id === replacedAt) {
					importRecord = { ...importRecord, valid: false };
				}
			};

			await runImport(importer, { users: { all: true }, channels: { all: true } });

			expect(imported).to.deep.equal(expected);
		});
	});

	it('should restore the settings that the import changed after it finishes', async () => {
		const importer = await createImporter({ users: [user('alice')] });
		let settingsDuringImport: Record<string, unknown> = {};
		onRecordImported = () => {
			settingsDuringImport = Object.fromEntries(settings);
		};

		await runImport(importer, { users: { all: true }, channels: { all: true } });

		expect(settingsDuringImport).to.deep.equal({
			Accounts_AllowUsernameChange: true,
			FileUpload_MaxFileSize: -1,
			FileUpload_MediaTypeWhiteList: '*',
			FileUpload_MediaTypeBlackList: '',
		});
		expect(importer.getProgress().step).to.equal(ProgressStep.DONE);
		expect(Object.fromEntries(settings)).to.deep.equal({
			Accounts_AllowUsernameChange: false,
			FileUpload_MaxFileSize: 0,
			FileUpload_MediaTypeWhiteList: '',
			FileUpload_MediaTypeBlackList: 'text/html',
		});
	});

	it('should report an error and restore the settings when the import fails', async () => {
		const importer = await createImporter({ users: [user('alice')], channels: [channel('general')] });
		incrementValueById.rejects(new Error('write failed'));

		await runImport(importer, { users: { all: true }, channels: { all: true } });

		expect(importer.getProgress().step).to.equal(ProgressStep.ERROR);
		expect(imported).to.deep.equal(['alice']);
		expect(settings.get('Accounts_AllowUsernameChange')).to.equal(false);
	});

	[
		{ directMessages: false, expected: ['general'] },
		{ directMessages: true, expected: ['general', '__directMessages__'] },
	].forEach(({ directMessages, expected }) => {
		it(`should ${directMessages ? '' : 'not '}list a direct messages entry when the import ${directMessages ? 'has' : 'has no'} direct messages`, async () => {
			checkIfDirectMessagesExists.resolves(directMessages);
			const importer = await createImporter({});

			const selection = await importer.buildSelection();

			expect(selection.channels.map(({ channel_id }: SelectionChannel) => channel_id)).to.deep.equal(expected);
		});
	});
});
