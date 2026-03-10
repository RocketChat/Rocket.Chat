import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatVisitors: {
		findOneByExternalId: sinon.stub(),
		findOneVisitorByPhone: sinon.stub(),
		addExternalId: sinon.stub(),
	},
};

const { resolveVisitor } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/resolveVisitor.ts', {
	'@rocket.chat/models': modelsMock,
});

describe('resolveVisitor', () => {
	beforeEach(() => {
		modelsMock.LivechatVisitors.findOneByExternalId.reset();
		modelsMock.LivechatVisitors.findOneVisitorByPhone.reset();
		modelsMock.LivechatVisitors.addExternalId.reset();
	});

	it('should return visitor when found by external ID without phone fallback', async () => {
		const existingVisitor = {
			_id: 'visitor-123',
			token: 'token-123',
			username: 'guest-1',
			externalIds: [{ source: 'whatsapp', userId: 'bsuid-123' }],
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(existingVisitor);

		const result = await resolveVisitor({
			externalId: { source: 'whatsapp', userId: 'bsuid-123' },
			phone: '1234567890',
		});

		expect(result).to.deep.equal(existingVisitor);
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnceWith('whatsapp', 'bsuid-123')).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhone.called).to.be.false;
		expect(modelsMock.LivechatVisitors.addExternalId.called).to.be.false;
	});

	it('should find by phone, enrich with external ID, and return visitor when not found by external ID', async () => {
		const existingVisitor = {
			_id: 'visitor-456',
			token: 'token-456',
			username: 'guest-2',
		};
		const externalId = { source: 'whatsapp', userId: 'bsuid-456', username: '@johndoe' };

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhone.resolves(existingVisitor);
		modelsMock.LivechatVisitors.addExternalId.resolves({ modifiedCount: 1 });

		const result = await resolveVisitor({ externalId, phone: '9876543210' });

		expect(result).to.deep.equal({ ...existingVisitor, externalIds: [externalId] });
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhone.calledOnceWith('9876543210')).to.be.true;
		expect(modelsMock.LivechatVisitors.addExternalId.calledOnceWith('visitor-456', externalId)).to.be.true;
	});

	it('should append to existing externalIds when visitor already has some', async () => {
		const existingExternalId = { source: 'telegram', userId: 'tg-123' };
		const existingVisitor = {
			_id: 'visitor-789',
			token: 'token-789',
			username: 'guest-3',
			externalIds: [existingExternalId],
		};
		const newExternalId = { source: 'whatsapp', userId: 'bsuid-789' };

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhone.resolves(existingVisitor);
		modelsMock.LivechatVisitors.addExternalId.resolves({ modifiedCount: 1 });

		const result = await resolveVisitor({ externalId: newExternalId, phone: '5555555555' });

		expect(result).to.deep.equal({ ...existingVisitor, externalIds: [existingExternalId, newExternalId] });
	});

	it('should return null when not found by external ID and no phone provided', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);

		const result = await resolveVisitor({ externalId: { source: 'whatsapp', userId: 'bsuid-unknown' } });

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhone.called).to.be.false;
	});

	it('should return null when not found by external ID or phone', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhone.resolves(null);

		const result = await resolveVisitor({
			externalId: { source: 'whatsapp', userId: 'bsuid-unknown' },
			phone: '0000000000',
		});

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhone.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.addExternalId.called).to.be.false;
	});

	it('should not attempt phone lookup when phone is empty string', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);

		const result = await resolveVisitor({
			externalId: { source: 'whatsapp', userId: 'bsuid-123' },
			phone: '',
		});

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhone.called).to.be.false;
	});
});
