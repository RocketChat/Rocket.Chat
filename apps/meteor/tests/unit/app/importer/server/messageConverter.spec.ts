import type { IImportMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';
import { vi } from 'vitest';

import type { MessageConverter as MessageConverterClass } from '../../../../../app/importer/server/classes/converters/MessageConverter';

const { settingsStub, modelsMock, insertMessage } = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		settingsStub: sinon.stub(),
		modelsMock: {
			Rooms: {
				findOneByImportId: sinon.stub(),
			},
		},
		insertMessage: sinon.stub(),
	};
});

vi.mock('../../../../../app/settings/server', () => ({ settings: { get: settingsStub } }));
vi.mock('../../../../../app/lib/server/functions/insertMessage', () => ({ insertMessage }));
vi.mock('@rocket.chat/models', () => modelsMock);

const { MessageConverter } = await import('../../../../../app/importer/server/classes/converters/MessageConverter');

describe('Message Converter', () => {
	beforeEach(() => {
		modelsMock.Rooms.findOneByImportId.reset();
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
			converter['_cache'].addRoom('general', 'general');

			const insertMessageStub = sinon.stub(converter, 'insertMessage' as keyof MessageConverterClass);
			sinon.stub(converter, 'resetLastMessages' as keyof MessageConverterClass);

			await converter.addObject(messageToImport as unknown as IImportMessage);
			await converter.convertData();

			expect(insertMessageStub.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertMessageStub.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(insertMessageStub.getCall(0).args[0]).to.be.deep.equal(messageToImport);
		});

		it('should call insertMessage lib function to save the message', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter['_cache'].addRoom('general', 'main');

			await converter['insertMessage'](messageToImport as unknown as IImportMessage);

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
	});

	describe('[buildMessageObject]', () => {
		it('should have the basic info', async () => {
			const converter = new MessageConverter({ workInMemory: true });

			const converted = await converter['buildMessageObject'](messageToImport as unknown as IImportMessage, 'general', {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			});

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

			const converted = await converter['buildMessageObject'](messageToImport as unknown as IImportMessage, 'general', {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			});

			Object.entries(converted).forEach(([key, value]) => {
				expect(value, `Property "${key}" should not be undefined`).to.not.be.undefined;
			});
		});

		// #TODO: Validate all message attributes
	});

	describe('callbacks', () => {
		it('beforeImportFn should be triggered', async () => {
			const beforeImportFn = sinon.stub();
			const converter = new MessageConverter({ workInMemory: true });
			converter['_cache'].addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage' as keyof MessageConverterClass);
			sinon.stub(converter, 'resetLastMessages' as keyof MessageConverterClass);

			await converter.addObject(messageToImport as unknown as IImportMessage);
			await converter.convertData({
				beforeImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('afterImportFn should be triggered', async () => {
			const afterImportFn = sinon.stub();
			const converter = new MessageConverter({ workInMemory: true });
			converter['_cache'].addRoom('general', 'general');

			const insertMessageStub = sinon.stub(converter, 'insertMessage' as keyof MessageConverterClass);
			sinon.stub(converter, 'resetLastMessages' as keyof MessageConverterClass);

			await converter.addObject(messageToImport as unknown as IImportMessage);
			await converter.convertData({
				afterImportFn,
			});

			expect(insertMessageStub.getCalls()).to.be.an('array').with.lengthOf(1);
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
			converter['_cache'].addRoom('general', 'general');

			const insertMessageStub = sinon.stub(converter, 'insertMessage' as keyof MessageConverterClass);
			sinon.stub(converter, 'resetLastMessages' as keyof MessageConverterClass);
			const skipRecordStub = sinon.stub(converter, 'skipRecord' as keyof MessageConverterClass);

			await converter.addObject(messageToImport as unknown as IImportMessage);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(skipRecordStub.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(skipRecordStub.getCall(0).args).to.be.an('array').that.is.deep.equal([recordId]);
			expect(insertMessageStub.getCalls()).to.be.an('array').with.lengthOf(0);
		});

		it('should not skip record if beforeImportFn returns true', async () => {
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake(() => true);

			const converter = new MessageConverter({ workInMemory: true });
			converter['_cache'].addRoom('general', 'general');

			const insertMessageStub = sinon.stub(converter, 'insertMessage' as keyof MessageConverterClass);
			sinon.stub(converter, 'resetLastMessages' as keyof MessageConverterClass);
			const skipRecordStub = sinon.stub(converter, 'skipRecord' as keyof MessageConverterClass);

			await converter.addObject(messageToImport as unknown as IImportMessage);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(skipRecordStub.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(insertMessageStub.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('onErrorFn should be triggered if mandatory attributes are missing', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter['_cache'].addRoom('general', 'general');
			sinon.stub(converter, 'resetLastMessages' as keyof MessageConverterClass);

			const onErrorFn = sinon.stub();

			const saveErrorStub = sinon.stub(converter, 'saveError' as keyof MessageConverterClass);

			await converter.addObject({} as unknown as IImportMessage);
			await converter.convertData({ onErrorFn });

			expect(onErrorFn.getCall(0)).to.not.be.null;
			expect(saveErrorStub.getCall(0)).to.not.be.null;
		});
	});
});
