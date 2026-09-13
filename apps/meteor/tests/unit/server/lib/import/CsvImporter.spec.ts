import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import AdmZip from 'adm-zip';
import { expect } from 'chai';
import { parse } from 'csv-parse/sync';
import { after, before, beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { ProgressStep } from '../../../../../app/importer/lib/ImporterProgressStep';

const converter = {
	clearImportData: sinon.stub(),
	addChannel: sinon.stub(),
	addUser: sinon.stub(),
	addMessage: sinon.stub(),
	addContact: sinon.stub(),
};

const logger = {
	debug: sinon.stub(),
	warn: sinon.stub(),
	error: sinon.stub(),
};

const progressUpdated = sinon.stub();
const updateProgress = sinon.stub();
const updateRecord = sinon.stub();
const incrementValueById = sinon.stub();
const notifyOnSettingChanged = sinon.stub();
const findOneByUsername = sinon.stub();
const addImportIds = sinon.stub();

class MockImporter {
	protected AdmZip = AdmZip;

	protected logger = logger;

	protected converter = converter;

	public importRecord: any;

	public progress: any;

	constructor(_info: any, importRecord: any) {
		this.importRecord = importRecord;
		this.progress = { step: ProgressStep.PREPARING_STARTED, count: { total: 0 } };
	}

	async updateProgress(step: string) {
		updateProgress(step);
		this.progress.step = step;
		return this.progress;
	}

	async updateRecord(fields: any) {
		updateRecord(fields);
		return this.importRecord;
	}

	async addCountToTotal(count: number) {
		this.progress.count.total += count;
		return this.progress;
	}

	getProgress() {
		return this.progress;
	}
}

const { CsvImporter } = proxyquire.noCallThru().load('../../../../../server/lib/import/csv/CsvImporter', {
	'@rocket.chat/models': {
		Settings: { incrementValueById },
		Users: { findOneByUsername, addImportIds },
	},
	'csv-parse/lib/sync': { parse },
	'..': {
		Importer: MockImporter,
		ProgressStep,
		ImporterWebsocket: { progressUpdated },
	},
	'../../notifyListener': { notifyOnSettingChanged },
});

const allStubs = [
	...Object.values(converter),
	...Object.values(logger),
	progressUpdated,
	updateProgress,
	updateRecord,
	incrementValueById,
	notifyOnSettingChanged,
	findOneByUsername,
	addImportIds,
];

type ZipEntry = { name: string; content?: string };

describe('CsvImporter', () => {
	let tmpDir: string;
	let zipCount = 0;

	before(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-csv-importer-'));
	});

	after(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	beforeEach(() => {
		allStubs.forEach((stub) => stub.reset());

		converter.clearImportData.resolves();
		converter.addChannel.resolves();
		converter.addUser.resolves();
		converter.addMessage.resolves();
		converter.addContact.resolves();
		incrementValueById.resolves(null);
		findOneByUsername.resolves(null);
		addImportIds.resolves();
	});

	const writeZip = (entries: ZipEntry[]): string => {
		const zip = new AdmZip();
		for (const entry of entries) {
			zip.addFile(entry.name, Buffer.from(entry.content ?? ''));
		}

		zipCount += 1;
		const filePath = path.join(tmpDir, `archive-${zipCount}.zip`);
		zip.writeZip(filePath);
		return filePath;
	};

	const runImport = async (entries: ZipEntry[]) => {
		const importer = new CsvImporter({ key: 'csv', name: 'CSV' }, { _id: 'import-id' });
		const progress = await importer.prepareUsingLocalFile(writeZip(entries));
		return { importer, progress };
	};

	const rates = () => progressUpdated.getCalls().map((call) => call.args[0].rate);

	const CHANNELS_CSV = ' general , admin , Public , alice ; bob \nsecret,owner,Private,carol;;dave;';
	const USERS_CSV = ' alice , alice@example.com , Alice Smith \nbob,bob@example.com,Bob Jones';
	const CONTACTS_CSV = 'name,emails,phones\nJane Doe,jane@example.com,+5511999';
	const CHANNEL_MESSAGES_CSV = 'alice,1700000000000,hello there\nbob,1700000001000,hi';
	const DM_MESSAGES_CSV = 'alice,bob,1700000002000,dm from alice\nbob,alice,1700000003000,dm from bob';

	const fullArchive = (): ZipEntry[] => [
		{ name: 'channels.csv', content: CHANNELS_CSV },
		{ name: 'users.csv', content: USERS_CSV },
		{ name: 'contacts.csv', content: CONTACTS_CSV },
		{ name: 'general/messages.csv', content: CHANNEL_MESSAGES_CSV },
		{ name: 'directmessages/messages.csv', content: DM_MESSAGES_CSV },
	];

	describe('archive setup and progress', () => {
		it('should clear previously imported data before reading the archive', async () => {
			await runImport(fullArchive());

			expect(converter.clearImportData.calledOnce).to.be.true;
			sinon.assert.callOrder(converter.clearImportData, converter.addUser);
		});

		it('should not emit a progress update when the calculated rate did not increase', async () => {
			const entries = Array.from({ length: 1001 }, (_, index) => ({ name: `__MACOSX/ignored-${index}`, content: '' }));

			await runImport(entries);

			expect(rates().filter((rate) => rate === 0)).to.have.lengthOf(1);
			expect(progressUpdated.callCount).to.equal(1002);
		});

		it('should log a progress update failure and keep importing', async () => {
			progressUpdated.onSecondCall().throws(new Error('streamer is down'));

			const { progress } = await runImport(fullArchive());

			expect(logger.error.calledWithMatch({ msg: 'Error while increasing CSV import progress' })).to.be.true;
			expect(converter.addUser.callCount).to.equal(2);
			expect(progress.step).to.not.equal(ProgressStep.ERROR);
			expect(rates()[rates().length - 1]).to.equal(100);
		});
	});

	describe('archive filtering and room identification', () => {
		it('should ignore __MACOSX and directory entries, advancing the progress rate for every entry', async () => {
			await runImport([
				{ name: '__MACOSX/general/messages.csv', content: CHANNEL_MESSAGES_CSV },
				{ name: 'general/', content: '' },
				{ name: 'general/messages.csv', content: CHANNEL_MESSAGES_CSV },
				{ name: 'readme.txt', content: 'not a csv the importer knows about' },
			]);

			expect(converter.addMessage.callCount).to.equal(2);
			expect(updateRecord.calledWithMatch({ messagesstatus: 'general/messages' })).to.be.true;
			expect(updateRecord.calledWithMatch({ messagesstatus: 'general/' })).to.be.false;
			expect(rates()).to.deep.equal([0, 25, 50, 75, 100, 100]);
		});

		it('should reuse the same generated room id for every reference to a room name', async () => {
			await runImport([
				{ name: 'channels.csv', content: 'general,admin,public,alice' },
				{ name: 'general/first.csv', content: 'alice,1700000000000,one' },
				{ name: 'general/second.csv', content: 'bob,1700000001000,two' },
			]);

			const channelId = converter.addChannel.firstCall.args[0].importIds[0];
			expect(channelId).to.be.a('string').and.not.empty;
			expect(converter.addMessage.getCalls().map((call) => call.args[0].rid)).to.deep.equal([channelId, channelId]);
		});
	});

	describe('channel parsing', () => {
		it('should parse channels.csv case-insensitively, trimming every field and dropping empty members', async () => {
			await runImport([{ name: 'Channels.CSV', content: CHANNELS_CSV }]);

			expect(updateProgress.calledWith(ProgressStep.PREPARING_CHANNELS)).to.be.true;
			expect(converter.addChannel.firstCall.args[0]).to.deep.include({
				name: 'general',
				u: { _id: 'admin' },
				users: ['alice', 'bob'],
			});
			expect(converter.addChannel.secondCall.args[0].users).to.deep.equal(['carol', 'dave']);
			expect(updateRecord.calledWithExactly({ 'count.channels': 2 })).to.be.true;
		});

		it('should map private channels to p and every other channel to c', async () => {
			await runImport([{ name: 'channels.csv', content: CHANNELS_CSV }]);

			expect(converter.addChannel.firstCall.args[0].t).to.equal('c');
			expect(converter.addChannel.secondCall.args[0].t).to.equal('p');
		});
	});

	describe('user and contact parsing', () => {
		it('should parse users.csv case-insensitively into importer user records', async () => {
			await runImport([{ name: 'Users.CSV', content: USERS_CSV }]);

			expect(updateProgress.calledWith(ProgressStep.PREPARING_USERS)).to.be.true;
			expect(converter.addUser.callCount).to.equal(2);
			expect(converter.addUser.firstCall.args[0]).to.deep.equal({
				type: 'user',
				importIds: ['alice'],
				emails: ['alice@example.com'],
				username: 'alice',
				name: 'Alice Smith',
			});
			expect(updateRecord.calledWithExactly({ 'count.users': 2 })).to.be.true;
		});

		it('should delegate contacts.csv rows to the contact importer and count the accepted ones', async () => {
			await runImport([{ name: 'Contacts.CSV', content: `${CONTACTS_CSV}\n,,` }]);

			expect(updateProgress.calledWith(ProgressStep.PREPARING_CONTACTS)).to.be.true;
			expect(converter.addContact.callCount).to.equal(1);
			expect(converter.addContact.firstCall.args[0]).to.deep.include({
				name: 'Jane Doe',
				emails: ['jane@example.com'],
				phones: ['+5511999'],
			});
			expect(updateRecord.calledWithExactly({ 'count.contacts': 1 })).to.be.true;
		});
	});

	describe('message parsing', () => {
		it('should move to the message preparation step only once for the whole archive', async () => {
			await runImport([
				{ name: 'general/first.csv', content: CHANNEL_MESSAGES_CSV },
				{ name: 'general/second.csv', content: CHANNEL_MESSAGES_CSV },
			]);

			expect(updateProgress.withArgs(ProgressStep.PREPARING_MESSAGES).callCount).to.equal(1);
		});

		it('should skip a message file with invalid csv syntax and warn about it', async () => {
			await runImport([
				{ name: 'general/broken.csv', content: 'alice,1700000000000,"unclosed' },
				{ name: 'general/valid.csv', content: CHANNEL_MESSAGES_CSV },
			]);

			expect(logger.warn.calledWithMatch({ msg: 'The file contains invalid syntax', entryName: 'general/broken.csv' })).to.be.true;
			expect(converter.addMessage.callCount).to.equal(2);
			expect(updateRecord.calledWithMatch({ messagesstatus: 'general/broken' })).to.be.false;
		});

		it('should convert a channel message with its room, author, timestamp and text', async () => {
			await runImport([{ name: 'general/messages.csv', content: CHANNEL_MESSAGES_CSV }]);

			const message = converter.addMessage.firstCall.args[0];
			expect(Object.keys(message).sort()).to.deep.equal(['msg', 'rid', 'ts', 'u']);
			expect(message.rid).to.be.a('string').and.not.empty;
			expect(message).to.deep.include({
				u: { _id: 'alice' },
				ts: new Date(1700000000000),
				msg: 'hello there',
			});
			expect(converter.addMessage.secondCall.args[0]).to.deep.include({
				rid: message.rid,
				u: { _id: 'bob' },
				ts: new Date(1700000001000),
				msg: 'hi',
			});
		});

		it('should convert direct messages into a single room per participant pair, whatever the username order', async () => {
			await runImport([{ name: 'directmessages/messages.csv', content: DM_MESSAGES_CSV }]);

			expect(converter.addChannel.calledOnce).to.be.true;
			expect(converter.addChannel.firstCall.args[0]).to.deep.equal({
				importIds: ['alice/bob'],
				users: ['alice', 'bob'],
				t: 'd',
			});
			expect(converter.addMessage.firstCall.args[0]).to.deep.equal({
				rid: 'alice/bob',
				u: { _id: 'alice' },
				ts: new Date(1700000002000),
				msg: 'dm from alice',
			});
			expect(converter.addMessage.getCalls().map((call) => call.args[0].rid)).to.deep.equal(['alice/bob', 'alice/bob']);
		});

		it('should skip a direct message row that has no other participant', async () => {
			await runImport([{ name: 'directmessages/messages.csv', content: 'alice,,1700000002000,orphan' }]);

			expect(converter.addChannel.called).to.be.false;
			expect(converter.addMessage.called).to.be.false;
		});

		it('should accumulate the message count across files, clearing the file status after each one', async () => {
			await runImport([
				{ name: 'general/first.csv', content: CHANNEL_MESSAGES_CSV },
				{ name: 'general/second.csv', content: 'alice,1700000004000,third' },
			]);

			expect(updateRecord.calledWithExactly({ 'count.messages': 2, 'messagesstatus': null })).to.be.true;
			expect(updateRecord.calledWithExactly({ 'count.messages': 3, 'messagesstatus': null })).to.be.true;

			const statusCalls = updateRecord
				.getCalls()
				.filter((call) => 'messagesstatus' in call.args[0])
				.map((call) => call.args[0].messagesstatus);

			expect(statusCalls).to.deep.equal(['general/first', null, 'general/second', null]);
		});
	});

	describe('post-processing', () => {
		it('should increment the csv importer setting with the imported user count and notify the listeners', async () => {
			const updatedSetting = { _id: 'CSV_Importer_Count', value: 7 };
			incrementValueById.resolves(updatedSetting);

			await runImport(fullArchive());

			expect(incrementValueById.calledOnceWithExactly('CSV_Importer_Count', 2, { returnDocument: 'after' })).to.be.true;
			expect(notifyOnSettingChanged.calledOnceWithExactly(updatedSetting)).to.be.true;
		});

		it('should not touch the csv importer setting when no user was parsed', async () => {
			await runImport([{ name: 'general/messages.csv', content: CHANNEL_MESSAGES_CSV }]);

			expect(incrementValueById.called).to.be.false;
		});

		it('should not notify the listeners when the setting update returned nothing', async () => {
			await runImport([{ name: 'users.csv', content: USERS_CSV }]);

			expect(notifyOnSettingChanged.called).to.be.false;
		});

		it('should add the import id to existing users that do not carry it yet', async () => {
			findOneByUsername.withArgs('alice').resolves({ _id: 'user-alice', importIds: ['other'] });
			findOneByUsername.withArgs('dana').resolves({ _id: 'user-dana' });

			await runImport([{ name: 'general/messages.csv', content: 'alice,1700000000000,hello\ndana,1700000001000,hi' }]);

			expect(addImportIds.calledTwice).to.be.true;
			expect(addImportIds.calledWithExactly('user-alice', 'alice')).to.be.true;
			expect(addImportIds.calledWithExactly('user-dana', 'dana')).to.be.true;
		});

		it('should reconcile a direct message recipient that never sent a message', async () => {
			findOneByUsername.withArgs('bob').resolves({ _id: 'user-bob', importIds: [] });

			await runImport([
				{ name: 'users.csv', content: ' alice , alice@example.com , Alice Smith ' },
				{ name: 'directmessages/messages.csv', content: 'alice,bob,1700000002000,dm from alice' },
			]);

			expect(findOneByUsername.calledOnceWithExactly('bob')).to.be.true;
			expect(addImportIds.calledOnceWithExactly('user-bob', 'bob')).to.be.true;
		});

		it('should leave unknown users and users that already carry the import id untouched', async () => {
			findOneByUsername.withArgs('carol').resolves({ _id: 'user-carol', importIds: ['carol'] });

			await runImport([{ name: 'general/messages.csv', content: 'ghost,1700000000000,hello\ncarol,1700000001000,hi' }]);

			expect(findOneByUsername.calledWithExactly('ghost')).to.be.true;
			expect(findOneByUsername.calledWithExactly('carol')).to.be.true;
			expect(addImportIds.called).to.be.false;
		});

		it('should add every parsed record to the import total and return the importer progress', async () => {
			const { importer, progress } = await runImport(fullArchive());

			expect(progress.count.total).to.equal(9);
			expect(progress).to.equal(importer.progress);
		});

		it('should fail the import when the archive holds no valid record', async () => {
			const { progress } = await runImport([{ name: '__MACOSX/ignored', content: '' }]);

			expect(logger.error.calledWithMatch({ msg: 'No valid record found in the import file.' })).to.be.true;
			expect(updateProgress.calledWith(ProgressStep.ERROR)).to.be.true;
			expect(progress.step).to.equal(ProgressStep.ERROR);
		});

		it('should not fail the import when only contacts were found', async () => {
			const { progress } = await runImport([{ name: 'contacts.csv', content: CONTACTS_CSV }]);

			expect(updateProgress.calledWith(ProgressStep.ERROR)).to.be.false;
			expect(progress.step).to.equal(ProgressStep.PREPARING_CONTACTS);
		});
	});
});
