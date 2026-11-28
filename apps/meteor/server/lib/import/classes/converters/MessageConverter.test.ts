import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const settingsStub = sinon.stub();
const insertMessage = sinon.stub();

let MessageConverter: any;

before(async () => {
	mock.module('../../../messages/insertMessage', { exports: { insertMessage } });
	({ MessageConverter } = await import('./MessageConverter'));
});

describe('Message Converter', () => {
	beforeEach(() => {
		insertMessage.reset();
		settingsStub.reset();
	});

	const messageToImport = {
		ts: Date.now(),
		u: {
			_id: 'rocket.cat',
		},
		rid: 'general',
		msg: 'testing',
	};

	describe('[insertMessage]', () => {
		it('function should be called by the converter', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');

			await converter.addObject(messageToImport);
			await converter.convertData();

			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.insertMessage.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(converter.insertMessage.getCall(0).args[0]).to.be.deep.equal(messageToImport);
		});

		it('should call insertMessage lib function to save the message', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'main');

			await (converter as any).insertMessage({ ...messageToImport });

			expect(insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertMessage.getCall(0).args).to.be.an('array').with.lengthOf(4);
			expect(insertMessage.getCall(0).args[0]).to.be.deep.equal({
				_id: 'rocket.cat',
				username: 'rocket.cat',
			});
			expect(insertMessage.getCall(0).args[1]).to.deep.include({
				ts: messageToImport.ts,
				msg: messageToImport.msg,
				rid: 'main',
			});
		});

		it('should save messages with an invalid timestamp at the time of the import, each after the previous one', async () => {
			const clock = sinon.useFakeTimers({ now: 1790000000000, toFake: ['Date'] });
			try {
				const converter = new MessageConverter({ workInMemory: true });
				converter._cache.addRoom('general', 'main');

				for (const ts of [new Date(-836412432), new Date(0), new Date(NaN), undefined]) {
					await (converter as any).insertMessage({ ...messageToImport, ts });
				}

				expect(insertMessage.getCalls().map((call) => call.args[1].ts.getTime())).to.deep.equal([
					1790000000000, 1790000000001, 1790000000002, 1790000000003,
				]);
			} finally {
				clock.restore();
			}
		});
	});

	describe('[buildMessageObject]', () => {
		it('should have the basic info', async () => {
			const converter = new MessageConverter({ workInMemory: true });

			const converted = await converter.buildMessageObject(messageToImport, 'general', { _id: 'rocket.cat', username: 'rocket.cat' });

			expect(converted)
				.to.be.an('object')
				.that.deep.includes({
					ts: messageToImport.ts,
					msg: messageToImport.msg,
					u: {
						_id: 'rocket.cat',
						username: 'rocket.cat',
					},
				});
		});

		it('should not have properties with undefined values', async () => {
			const converter = new MessageConverter({ workInMemory: true });

			const converted = await converter.buildMessageObject(messageToImport, 'general', { _id: 'rocket.cat', username: 'rocket.cat' });

			Object.entries(converted).forEach(([key, value]) => {
				expect(value, `Property "${key}" should not be undefined`).to.not.be.undefined;
			});
		});

		// #TODO: Validate all message attributes

		it('should include _hidden field when present', async () => {
			const converter = new MessageConverter({ workInMemory: true });

			const hiddenMessage = {
				...messageToImport,
				_hidden: true,
			};

			const converted = await converter.buildMessageObject(hiddenMessage, 'general', { _id: 'rocket.cat', username: 'rocket.cat' });

			expect(converted).to.have.property('_hidden', true);
		});

		it('should include _importFile field when present', async () => {
			const converter = new MessageConverter({ workInMemory: true });

			const importFile = {
				id: 'F12345',
				name: 'test.png',
				downloadUrl: 'https://files.slack.com/F12345/test.png',
				size: 1024,
				source: 'slack',
			};

			const fileMessage = {
				...messageToImport,
				_hidden: true,
				msg: '',
				_importFile: importFile,
			};

			const converted = await converter.buildMessageObject(fileMessage, 'general', { _id: 'rocket.cat', username: 'rocket.cat' });

			expect(converted).to.have.property('_hidden', true);
			expect(converted).to.have.property('msg', '');
			expect(converted).to.have.property('_importFile').that.deep.includes({
				id: 'F12345',
				name: 'test.png',
			});
		});

		it('should not include _hidden field when not present or false', async () => {
			const converter = new MessageConverter({ workInMemory: true });

			const converted = await converter.buildMessageObject(messageToImport, 'general', { _id: 'rocket.cat', username: 'rocket.cat' });

			expect(converted).to.not.have.property('_hidden');
		});
	});

	describe('[convertMessageMentions]', () => {
		const convertMentions = async (msg: string, users: Record<string, string>) => {
			const converter = new MessageConverter({ workInMemory: true });
			for (const [importId, username] of Object.entries(users)) {
				converter._cache.addUser(importId, `id-${username}`, username);
				converter._cache.addUserDisplayName(importId, username);
			}

			const message = { ...messageToImport, msg, mentions: Object.keys(users) };
			await converter.convertMessageMentions(message);
			return message.msg;
		};

		it('should replace every mention of an imported user, regardless of case', async () => {
			expect(await convertMentions('hi @U1, @u1 and @U1.', { U1: 'alice' })).to.equal('hi @alice, @alice and @alice.');
		});

		it('should leave mentions of a longer import id that starts with the same characters', async () => {
			expect(await convertMentions('ping @U1 and @U12', { U1: 'alice', U12: 'bob' })).to.equal('ping @alice and @bob');
		});

		it('should match the import id literally', async () => {
			expect(await convertMentions('@johnxdoe and @john.doe', { 'john.doe': 'jd' })).to.equal('@johnxdoe and @jd');
		});

		it('should replace mentions of an import id with regular expression characters', async () => {
			expect(await convertMentions('hi @c++', { 'c++': 'cpp' })).to.equal('hi @cpp');
		});

		it('should leave email addresses alone', async () => {
			expect(await convertMentions('write to x@U1, @U1', { U1: 'alice' })).to.equal('write to x@U1, @alice');
		});

		it('should insert the username literally', async () => {
			expect(await convertMentions('hi @U1', { U1: 'a$&b' })).to.equal('hi @a$&b');
		});

		it('should prefer the longest import id when a shorter one is listed first', async () => {
			expect(await convertMentions('@c @c++', { 'c': 'cat', 'c++': 'cpp' })).to.equal('@cat @cpp');
		});

		it('should not rewrite a username that is another import id', async () => {
			expect(await convertMentions('@U1 @U2', { U1: 'U2', U2: 'alice' })).to.equal('@U2 @alice');
		});

		it('should leave mentions of a user on another server alone', async () => {
			expect(await convertMentions('@U1:matrix.org, @U1@other.server and @U1: hi', { U1: 'alice' })).to.equal(
				'@U1:matrix.org, @U1@other.server and @alice: hi',
			);
		});

		it('should leave URL paths alone', async () => {
			expect(await convertMentions('https://host/@U1 and @U1', { U1: 'alice' })).to.equal('https://host/@U1 and @alice');
		});
	});

	describe('[convertMessageChannels]', () => {
		const convertChannels = async (msg: string, rooms: Record<string, string>) => {
			const converter = new MessageConverter({ workInMemory: true });
			for (const [importId, name] of Object.entries(rooms)) {
				converter._cache.addRoom(importId, `id-${name}`);
				converter._cache.addRoomName(importId, name);
			}

			const message = { ...messageToImport, msg, channels: Object.keys(rooms) };
			await converter.convertMessageChannels(message);
			return message.msg;
		};

		it('should replace mentions of an imported channel', async () => {
			expect(await convertChannels('see #general.', { general: 'lobby' })).to.equal('see #lobby.');
		});

		it('should leave mentions of a longer channel name that starts with the same characters', async () => {
			expect(await convertChannels('#general and #general-2', { 'general': 'lobby', 'general-2': 'random' })).to.equal(
				'#lobby and #random',
			);
		});

		it('should match the channel name literally', async () => {
			expect(await convertChannels('#devXops and #dev.ops', { 'dev.ops': 'devops' })).to.equal('#devXops and #devops');
		});

		it('should not rewrite a channel name that is another import id', async () => {
			expect(await convertChannels('#general #general-2', { 'general': 'general-2', 'general-2': 'random' })).to.equal(
				'#general-2 #random',
			);
		});
	});

	describe('callbacks', () => {
		it('beforeImportFn should be triggered', async () => {
			const beforeImportFn = sinon.stub();
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');

			await converter.addObject(messageToImport);
			await converter.convertData({
				beforeImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('afterImportFn should be triggered', async () => {
			const afterImportFn = sinon.stub();
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');

			await converter.addObject(messageToImport);
			await converter.convertData({
				afterImportFn,
			});

			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('should skip record if beforeImportFn returns false', async () => {
			let recordId = null;
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake((record) => {
				recordId = record._id;
				return false;
			});

			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');
			sinon.stub(converter, 'skipRecord');

			await converter.addObject(messageToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.skipRecord.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.skipRecord.getCall(0).args).to.be.an('array').that.is.deep.equal([recordId]);
			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(0);
		});

		it('should not skip record if beforeImportFn returns true', async () => {
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake(() => true);

			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');
			sinon.stub(converter, 'skipRecord');

			await converter.addObject(messageToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.skipRecord.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('onErrorFn should be triggered if mandatory attributes are missing', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');
			sinon.stub(converter, 'resetLastMessages');

			const onErrorFn = sinon.stub();

			sinon.stub(converter, 'saveError');

			await converter.addObject({});
			await converter.convertData({ onErrorFn });

			expect(onErrorFn.getCall(0)).to.not.be.null;
			expect(converter.saveError.getCall(0)).to.not.be.null;
		});
	});
});
