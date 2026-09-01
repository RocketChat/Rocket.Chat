import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findContactMatchingVisitor: sinon.stub(),
	},
	LivechatRooms: {
		setContactByVisitorAssociation: sinon.stub(),
		findNewestByContactVisitorAssociation: sinon.stub(),
	},
};

const createContactFromVisitor = sinon.stub();
const mergeVisitorIntoContact = sinon.stub();

const { migrateVisitorToContactId } = proxyquire.noCallThru().load('./migrateVisitorToContactId', {
	'./createContactFromVisitor': {
		createContactFromVisitor,
	},
	'./ContactMerger': {
		ContactMerger: {
			mergeVisitorIntoContact,
		},
	},
	'@rocket.chat/models': modelsMock,
	'../logger': {
		livechatContactsLogger: {
			debug: sinon.stub(),
		},
	},
});

describe('migrateVisitorToContactId', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findContactMatchingVisitor.reset();
		modelsMock.LivechatRooms.setContactByVisitorAssociation.reset();
		modelsMock.LivechatRooms.findNewestByContactVisitorAssociation.reset();
		createContactFromVisitor.reset();
		mergeVisitorIntoContact.reset();
	});

	it('should not create a contact if there is no source for the visitor', async () => {
		expect(await migrateVisitorToContactId({ visitor: { _id: 'visitor1' } })).to.be.null;
	});

	it('should attempt to create a new contact if there is no free existing contact matching the visitor data', async () => {
		modelsMock.LivechatContacts.findContactMatchingVisitor.resolves(undefined);
		const visitor = { _id: 'visitor1' };
		const source = { type: 'other' };
		modelsMock.LivechatRooms.findNewestByContactVisitorAssociation.resolves({ _id: 'room1', v: { _id: visitor._id }, source });
		createContactFromVisitor.resolves('contactCreated');

		expect(await migrateVisitorToContactId({ visitor: { _id: 'visitor1' }, source })).to.be.equal('contactCreated');
	});

	it('should not attempt to create a new contact if one is found for the visitor', async () => {
		const visitor = { _id: 'visitor1' };
		const contact = { _id: 'contact1' };
		const source = { type: 'sms' };
		modelsMock.LivechatRooms.findNewestByContactVisitorAssociation.resolves({ _id: 'room1', v: { _id: visitor._id }, source });
		modelsMock.LivechatContacts.findContactMatchingVisitor.resolves(contact);
		createContactFromVisitor.resolves('contactCreated');

		expect(await migrateVisitorToContactId({ visitor, source })).to.be.equal('contact1');
		expect(mergeVisitorIntoContact.calledOnceWith(visitor, contact, source)).to.be.true;
	});
});
