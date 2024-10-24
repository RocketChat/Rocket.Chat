import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findContactMatchingVisitor: sinon.stub(),
	},
	LivechatRooms: {
		setContactIdByVisitorIdOrToken: sinon.stub(),
	},
};

const createContactFromVisitor = sinon.stub();
const getVisitorNewestSource = sinon.stub();
const mergeVisitorIntoContact = sinon.stub();

const { migrateVisitorToContactId } = proxyquire
	.noCallThru()
	.load('../../../../../../app/livechat/server/lib/contacts/migrateVisitorToContactId', {
		'./createContactFromVisitor': {
			createContactFromVisitor,
		},
		'./getVisitorNewestSource': {
			getVisitorNewestSource,
		},
		'./ContactMerger': {
			ContactMerger: {
				mergeVisitorIntoContact,
			},
		},
		'@rocket.chat/models': modelsMock,
		'../LivechatTyped': {
			Livechat: {
				logger: {
					debug: sinon.stub(),
				},
			},
		},
	});

describe('migrateVisitorToContactId', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findContactMatchingVisitor.reset();
		modelsMock.LivechatRooms.setContactIdByVisitorIdOrToken.reset();
		createContactFromVisitor.reset();
		getVisitorNewestSource.reset();
		mergeVisitorIntoContact.reset();
	});

	it('should not create a contact if there is no source for the visitor', async () => {
		expect(await migrateVisitorToContactId({ _id: 'visitor1' })).to.be.null;
		expect(getVisitorNewestSource.getCall(0)).to.not.be.null;
	});

	it('should attempt to create a new contact if there is no free existing contact matching the visitor data', async () => {
		modelsMock.LivechatContacts.findContactMatchingVisitor.resolves(undefined);
		createContactFromVisitor.resolves('contactCreated');

		expect(await migrateVisitorToContactId({ _id: 'visitor1' }, { type: 'other' })).to.be.equal('contactCreated');
		expect(getVisitorNewestSource.getCall(0)).to.be.null;
	});

	it('should load the source from existing visitor rooms if none is provided', async () => {
		modelsMock.LivechatContacts.findContactMatchingVisitor.resolves(undefined);
		const source = { type: 'sms' };
		getVisitorNewestSource.resolves(source);
		createContactFromVisitor.resolves('contactCreated');

		const visitor = { _id: 'visitor1' };

		expect(await migrateVisitorToContactId(visitor)).to.be.equal('contactCreated');
		expect(getVisitorNewestSource.getCall(0)).to.not.be.null;
		expect(createContactFromVisitor.getCall(0).args[0]).to.be.deep.equal(visitor);
		expect(createContactFromVisitor.getCall(0).args[1]).to.be.deep.equal(source);
	});

	it('should not attempt to create a new contact if one is found for the visitor', async () => {
		const visitor = { _id: 'visitor1' };
		const contact = { _id: 'contact1' };
		const source = { type: 'sms' };
		modelsMock.LivechatContacts.findContactMatchingVisitor.resolves(contact);
		createContactFromVisitor.resolves('contactCreated');

		expect(await migrateVisitorToContactId(visitor, source)).to.be.equal('contact1');
		expect(mergeVisitorIntoContact.getCall(0)).to.not.be.null;
		expect(mergeVisitorIntoContact.getCall(0).args[0]).to.be.deep.equal(visitor);
		expect(mergeVisitorIntoContact.getCall(0).args[1]).to.be.deep.equal(contact);
	});
});
