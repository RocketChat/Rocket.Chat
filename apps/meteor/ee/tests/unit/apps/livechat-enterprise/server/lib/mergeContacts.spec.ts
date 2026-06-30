import { expect } from 'chai';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

// Stubs are built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them. sinon is
// require()d inside the hoisted block because the top-level import has not executed at hoist time.
// NOTE: relative `vi.mock` specifiers are resolved relative to THIS spec file (not the source).
const { modelsMock, contactMergerStub, mergeContactsPatch, loggerStub, notifyOnSettingChangedStub } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		modelsMock: {
			LivechatContacts: {
				findOneEnabledById: sinon.stub(),
				findSimilarVerifiedContacts: sinon.stub(),
				deleteMany: sinon.stub(),
			},
			LivechatRooms: {
				updateMergedContactIds: sinon.stub(),
			},
			Settings: {
				incrementValueById: sinon.stub(),
			},
		},
		contactMergerStub: {
			getAllFieldsFromContact: sinon.stub(),
			mergeFieldsIntoContact: sinon.stub(),
		},
		mergeContactsPatch: sinon.stub(),
		loggerStub: { info: sinon.stub(), debug: sinon.stub() },
		notifyOnSettingChangedStub: sinon.stub(),
	};
});

vi.mock('../../../../../../../app/livechat/server/lib/contacts/mergeContacts', () => ({ mergeContacts: { patch: mergeContactsPatch } }));
vi.mock('../../../../../../../app/livechat/server/lib/contacts/ContactMerger', () => ({ ContactMerger: contactMergerStub }));
vi.mock('../../../../../../app/livechat-enterprise/server/lib/logger', () => ({ contactLogger: loggerStub }));
vi.mock('../../../../../../../app/lib/server/lib/notifyListener', () => ({ notifyOnSettingChanged: notifyOnSettingChangedStub }));
vi.mock('@rocket.chat/models', () => modelsMock);

const { runMergeContacts } = await import('../../../../../../server/patches/mergeContacts');

describe('mergeContacts', () => {
	const targetChannel = {
		name: 'channelName',
		visitor: {
			visitorId: 'visitorId',
			source: {
				type: 'sms',
			},
		},
		verified: true,
		verifiedAt: new Date(),
		field: 'field',
		value: 'value',
	};

	beforeEach(() => {
		modelsMock.LivechatContacts.findOneEnabledById.reset();
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.reset();
		modelsMock.LivechatContacts.deleteMany.reset();
		modelsMock.LivechatRooms.updateMergedContactIds.reset();
		modelsMock.Settings.incrementValueById.reset();
		contactMergerStub.getAllFieldsFromContact.reset();
		contactMergerStub.mergeFieldsIntoContact.reset();
		modelsMock.LivechatContacts.deleteMany.resolves({ deletedCount: 0 });
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should throw an error if contact does not exist', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves(undefined);

		await expect(runMergeContacts(() => undefined, 'invalidId', { visitorId: 'visitorId', source: { type: 'sms' } })).to.be.rejectedWith(
			'error-invalid-contact',
		);
	});

	it('should throw an error if contact channel does not exist', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({
			_id: 'contactId',
			channels: [{ name: 'channelName', visitor: { visitorId: 'visitorId', source: { type: 'sms' } } }],
		});

		await expect(
			runMergeContacts(() => undefined, 'contactId', { visitorId: 'invalidVisitorId', source: { type: 'sms' } }),
		).to.be.rejectedWith('error-invalid-channel');
	});

	it('should do nothing if there are no similar verified contacts', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves({ _id: 'contactId', channels: [targetChannel] });
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.resolves([]);

		await runMergeContacts(() => undefined, 'contactId', { visitorId: 'visitorId', source: { type: 'sms' } });

		expect(modelsMock.LivechatContacts.findOneEnabledById.calledOnceWith('contactId')).to.be.true;
		expect(modelsMock.LivechatContacts.findSimilarVerifiedContacts.calledOnceWith(targetChannel, 'contactId')).to.be.true;
		expect(modelsMock.LivechatContacts.deleteMany.notCalled).to.be.true;
		expect(contactMergerStub.getAllFieldsFromContact.notCalled).to.be.true;
		expect(contactMergerStub.mergeFieldsIntoContact.notCalled).to.be.true;
	});

	it('should be able to merge similar contacts', async () => {
		const similarContact = {
			_id: 'differentId',
			emails: ['email2'],
			phones: ['phone2'],
			channels: [{ name: 'channelName2', visitorId: 'visitorId2', field: 'field', value: 'value' }],
		};
		const originalContact = {
			_id: 'contactId',
			emails: ['email1'],
			phones: ['phone1'],
			channels: [targetChannel],
		};

		modelsMock.LivechatContacts.findOneEnabledById.resolves(originalContact);
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.resolves([similarContact]);
		modelsMock.Settings.incrementValueById.resolves({ value: undefined });

		await runMergeContacts(() => undefined, 'contactId', { visitorId: 'visitorId', source: { type: 'sms' } });

		expect(modelsMock.LivechatContacts.findOneEnabledById.calledTwice).to.be.true;
		expect(modelsMock.LivechatContacts.findOneEnabledById.calledWith('contactId')).to.be.true;
		expect(modelsMock.LivechatContacts.findSimilarVerifiedContacts.calledOnceWith(targetChannel, 'contactId')).to.be.true;
		expect(contactMergerStub.getAllFieldsFromContact.calledOnceWith(similarContact)).to.be.true;

		expect(contactMergerStub.mergeFieldsIntoContact.getCall(0).args[0].contact).to.be.deep.equal(originalContact);

		expect(modelsMock.LivechatContacts.deleteMany.calledOnceWith({ _id: { $in: ['differentId'] } })).to.be.true;
		expect(modelsMock.LivechatRooms.updateMergedContactIds.calledOnceWith(['differentId'], 'contactId')).to.be.true;
		expect(modelsMock.Settings.incrementValueById.calledOnceWith('Merged_Contacts_Count', 1)).to.be.true;
	});
});
