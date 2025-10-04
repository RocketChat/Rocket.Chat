import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneEnabledById: sinon.stub(),
		disableByContactId: sinon.stub(),
	},
	LivechatRooms: {
		checkContactOpenRooms: sinon.stub(),
	},
};

const settingsMock = {
	get: sinon.stub(),
};

const removeGuestMock = { removeGuest: sinon.stub() };

const { disableContactById } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/contacts/disableContact.ts', {
	'@rocket.chat/models': modelsMock,
	'../guests': removeGuestMock,
	'../../../../settings/server': { settings: settingsMock },
});

describe('disableContact', () => {
	const contact = {
		_id: 'contact-id',
		channels: [
			{
				visitor: {
					visitorId: 'visitor-id',
				},
			},
		],
	};

	beforeEach(() => {
		modelsMock.LivechatContacts.findOneEnabledById.reset();
		modelsMock.LivechatRooms.checkContactOpenRooms.reset();
		modelsMock.LivechatContacts.disableByContactId.reset();
		settingsMock.get.reset();
		removeGuestMock.removeGuest.reset();
	});

	it('should disable the contact', async () => {
		settingsMock.get.withArgs('Livechat_Allow_collect_and_store_HTTP_header_informations').returns(true);
		modelsMock.LivechatContacts.findOneEnabledById.resolves(contact);
		modelsMock.LivechatRooms.checkContactOpenRooms.resolves(null);
		removeGuestMock.removeGuest.resolves();
		modelsMock.LivechatContacts.disableByContactId.resolves();

		await disableContactById(contact._id);

		expect(modelsMock.LivechatContacts.findOneEnabledById.calledOnceWith(contact._id)).to.be.true;
		expect(modelsMock.LivechatRooms.checkContactOpenRooms.calledOnceWith(contact._id)).to.be.true;
		expect(removeGuestMock.removeGuest.calledOnceWith({ _id: 'visitor-id' })).to.be.true;
		expect(modelsMock.LivechatContacts.disableByContactId.calledOnceWith(contact._id)).to.be.true;
	});

	it('should call removeGuest for each channel the contact has communicated from', async () => {
		contact.channels.push({ visitor: { visitorId: 'visitor-id-2' } });

		settingsMock.get.withArgs('Livechat_Allow_collect_and_store_HTTP_header_informations').returns(true);
		modelsMock.LivechatContacts.findOneEnabledById.resolves(contact);
		modelsMock.LivechatRooms.checkContactOpenRooms.resolves(null);
		removeGuestMock.removeGuest.resolves();
		modelsMock.LivechatContacts.disableByContactId.resolves();

		await disableContactById(contact._id);

		expect(modelsMock.LivechatContacts.findOneEnabledById.calledOnceWith(contact._id)).to.be.true;
		expect(modelsMock.LivechatContacts.findOneEnabledById.calledOnceWith(contact._id)).to.be.true;
		expect(modelsMock.LivechatRooms.checkContactOpenRooms.calledOnceWith(contact._id)).to.be.true;
		expect(removeGuestMock.removeGuest.calledTwice).to.be.true;
		expect(removeGuestMock.removeGuest.getCall(0).args[0]).to.deep.equal({ _id: 'visitor-id' });
		expect(removeGuestMock.removeGuest.getCall(1).args[0]).to.deep.equal({ _id: 'visitor-id-2' });
		expect(modelsMock.LivechatContacts.disableByContactId.calledOnceWith(contact._id)).to.be.true;
	});

	it('should throw error if contact is not found', async () => {
		modelsMock.LivechatContacts.findOneEnabledById.resolves(null);

		await expect(disableContactById('nonexistent-contact-id')).to.be.rejectedWith('error-contact-not-found');

		expect(modelsMock.LivechatContacts.findOneEnabledById.calledOnceWith('nonexistent-contact-id')).to.be.true;
		expect(modelsMock.LivechatRooms.checkContactOpenRooms.notCalled).to.be.true;
		expect(removeGuestMock.removeGuest.notCalled).to.be.true;
		expect(modelsMock.LivechatContacts.disableByContactId.notCalled).to.be.true;
	});

	it('should throw error if contact has open rooms and GDPR is disabled', async () => {
		settingsMock.get.withArgs('Livechat_Allow_collect_and_store_HTTP_header_informations').returns(false);
		modelsMock.LivechatContacts.findOneEnabledById.resolves(contact);
		modelsMock.LivechatRooms.checkContactOpenRooms.resolves({ _id: 'room-id' });
		modelsMock.LivechatContacts.disableByContactId.resolves();

		await expect(disableContactById(contact._id)).to.be.rejectedWith('error-contact-has-open-rooms');

		expect(modelsMock.LivechatRooms.checkContactOpenRooms.calledOnceWith(contact._id)).to.be.true;
		expect(removeGuestMock.removeGuest.notCalled).to.be.true;
		expect(modelsMock.LivechatContacts.disableByContactId.notCalled).to.be.true;
	});
});
