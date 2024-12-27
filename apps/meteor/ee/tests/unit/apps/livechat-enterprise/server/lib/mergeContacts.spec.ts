import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		findSimilarVerifiedContacts: sinon.stub(),
		deleteMany: sinon.stub(),
	},
	LivechatRooms: {
		updateMergedContactIds: sinon.stub(),
	},
	Settings: {
		incrementValueById: sinon.stub(),
	},
};

const contactMergerStub = {
	getAllFieldsFromContact: sinon.stub(),
	mergeFieldsIntoContact: sinon.stub(),
};

const { runMergeContacts } = proxyquire.noCallThru().load('../../../../../../server/patches/mergeContacts', {
	'../../../app/livechat/server/lib/contacts/mergeContacts': { mergeContacts: { patch: sinon.stub() } },
	'../../../app/livechat/server/lib/contacts/ContactMerger': { ContactMerger: contactMergerStub },
	'../../../app/livechat-enterprise/server/lib/logger': { logger: { info: sinon.stub(), debug: sinon.stub() } },
	'../../../app/lib/server/lib/notifyListener': { notifyOnSettingChanged: sinon.stub() },
	'@rocket.chat/models': modelsMock,
});

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
		modelsMock.LivechatContacts.findOneById.reset();
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
		modelsMock.LivechatContacts.findOneById.resolves(undefined);

		await expect(runMergeContacts(() => undefined, 'invalidId', { visitorId: 'visitorId', source: { type: 'sms' } })).to.be.rejectedWith(
			'error-invalid-contact',
		);
	});

	it('should throw an error if contact channel does not exist', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			_id: 'contactId',
			channels: [{ name: 'channelName', visitor: { visitorId: 'visitorId', source: { type: 'sms' } } }],
		});

		await expect(
			runMergeContacts(() => undefined, 'contactId', { visitorId: 'invalidVisitorId', source: { type: 'sms' } }),
		).to.be.rejectedWith('error-invalid-channel');
	});

	it('should do nothing if there are no similar verified contacts', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId', channels: [targetChannel] });
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.resolves([]);

		await runMergeContacts(() => undefined, 'contactId', { visitorId: 'visitorId', source: { type: 'sms' } });

		expect(modelsMock.LivechatContacts.findOneById.calledOnceWith('contactId')).to.be.true;
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

		modelsMock.LivechatContacts.findOneById.resolves(originalContact);
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.resolves([similarContact]);
		modelsMock.Settings.incrementValueById.resolves({ value: undefined });

		await runMergeContacts(() => undefined, 'contactId', { visitorId: 'visitorId', source: { type: 'sms' } });

		expect(modelsMock.LivechatContacts.findOneById.calledTwice).to.be.true;
		expect(modelsMock.LivechatContacts.findOneById.calledWith('contactId')).to.be.true;
		expect(modelsMock.LivechatContacts.findSimilarVerifiedContacts.calledOnceWith(targetChannel, 'contactId')).to.be.true;
		expect(contactMergerStub.getAllFieldsFromContact.calledOnceWith(similarContact)).to.be.true;

		expect(contactMergerStub.mergeFieldsIntoContact.getCall(0).args[0].contact).to.be.deep.equal(originalContact);

		expect(modelsMock.LivechatContacts.deleteMany.calledOnceWith({ _id: { $in: ['differentId'] } })).to.be.true;
		expect(modelsMock.LivechatRooms.updateMergedContactIds.calledOnceWith(['differentId'], 'contactId')).to.be.true;
		expect(modelsMock.Settings.incrementValueById.calledOnceWith('Merged_Contacts_Count', 1)).to.be.true;
	});
});
