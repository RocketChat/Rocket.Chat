import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		findOneByVisitorId: sinon.stub(),
	},
	LivechatVisitors: {
		findOneById: sinon.stub(),
	},
};

const migrateVisitorToContactId = sinon.stub();

const { getContact } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/contacts/getContact', {
	'./migrateVisitorToContactId': {
		migrateVisitorToContactId,
	},
	'@rocket.chat/models': modelsMock,
});

describe('getContact', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.LivechatContacts.findOneByVisitorId.reset();
		modelsMock.LivechatVisitors.findOneById.reset();
		migrateVisitorToContactId.reset();
	});

	describe('using contactId', () => {
		it('should return the contact data without searching for visitor.', async () => {
			const contact = { _id: 'any_id' };
			modelsMock.LivechatContacts.findOneById.resolves(contact);

			expect(await getContact('any_id')).to.be.deep.equal(contact);

			expect(modelsMock.LivechatVisitors.findOneById.getCall(0)).to.be.null;
			expect(migrateVisitorToContactId.getCall(0)).to.be.null;
		});
	});

	describe('using visitorId', () => {
		it('should return null if neither a contact nor visitor match the ID', async () => {
			modelsMock.LivechatContacts.findOneById.resolves(undefined);
			modelsMock.LivechatVisitors.findOneById.resolves(undefined);
			expect(await getContact('any_id')).to.be.null;

			expect(modelsMock.LivechatVisitors.findOneById.getCall(0).args[0]).to.be.equal('any_id');
			expect(migrateVisitorToContactId.getCall(0)).to.be.null;
		});

		it('should return an existing contact already associated with that visitor', async () => {
			modelsMock.LivechatContacts.findOneById.resolves(undefined);
			modelsMock.LivechatVisitors.findOneById.resolves({
				_id: 'visitor1',
			});

			const contact = { _id: 'contact1' };
			modelsMock.LivechatContacts.findOneByVisitorId.resolves(contact);

			expect(await getContact('any_id')).to.be.deep.equal(contact);

			expect(migrateVisitorToContactId.getCall(0)).to.be.null;
		});

		it('should attempt to migrate the visitor into a new contact if there is no existing contact', async () => {
			modelsMock.LivechatContacts.findOneById.resolves(undefined);
			const visitor = { _id: 'visitor1' };
			modelsMock.LivechatVisitors.findOneById.resolves(visitor);
			modelsMock.LivechatContacts.findOneByVisitorId.resolves(undefined);

			expect(await getContact('any_id')).to.be.null;
			expect(migrateVisitorToContactId.getCall(0)).to.not.be.null;
			expect(migrateVisitorToContactId.getCall(0).args[0]).to.be.deep.equal(visitor);
		});

		it('should load data for the created contact when migration happens successfully', async () => {
			modelsMock.LivechatContacts.findOneById.callsFake((id) => {
				if (id === 'contact1') {
					return {
						_id: 'new_id',
					};
				}
				return undefined;
			});
			const visitor = { _id: 'visitor1' };
			modelsMock.LivechatVisitors.findOneById.resolves(visitor);
			modelsMock.LivechatContacts.findOneByVisitorId.resolves(undefined);

			migrateVisitorToContactId.resolves('contact1');

			expect(await getContact('any_id')).to.be.deep.equal({ _id: 'new_id' });
			expect(migrateVisitorToContactId.getCall(0)).to.not.be.null;
			expect(migrateVisitorToContactId.getCall(0).args[0]).to.be.deep.equal(visitor);

			expect(modelsMock.LivechatContacts.findOneById.getCall(0)).to.not.be.null;
			expect(modelsMock.LivechatContacts.findOneById.getCall(1)).to.not.be.null;
			expect(modelsMock.LivechatContacts.findOneById.getCall(1).args[0]).to.be.equal('contact1');
		});
	});
});
