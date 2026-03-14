import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatVisitors: {
		findOneByExternalId: sinon.stub(),
		findOneVisitorByPhoneAndAddExternalId: sinon.stub(),
	},
};

const { resolveVisitor } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/resolveVisitor.ts', {
	'@rocket.chat/models': modelsMock,
});

// Mock app ID (UUID format as used by Rocket.Chat apps)
const appId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('resolveVisitor', () => {
	beforeEach(() => {
		modelsMock.LivechatVisitors.findOneByExternalId.reset();
		modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.reset();
	});

	it('should return visitor when found by external ID without phone fallback', async () => {
		const existingVisitor = {
			_id: 'visitor-123',
			token: 'token-123',
			username: 'guest-1',
			externalIds: { [appId]: { userId: 'bsuid-123' } },
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(existingVisitor);

		const result = await resolveVisitor({
			source: appId,
			externalId: { userId: 'bsuid-123' },
			phone: '1234567890',
		});

		expect(result).to.deep.equal(existingVisitor);
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnceWith(appId, 'bsuid-123')).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.called).to.be.false;
	});

	it('should find by phone, enrich with external ID, and return visitor when not found by external ID', async () => {
		const externalId = { userId: 'bsuid-456', username: '@johndoe' };
		const updatedVisitor = {
			_id: 'visitor-456',
			token: 'token-456',
			username: 'guest-2',
			externalIds: { [appId]: externalId },
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.resolves(updatedVisitor);

		const result = await resolveVisitor({ source: appId, externalId, phone: '9876543210' });

		expect(result).to.deep.equal(updatedVisitor);
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.calledOnceWith('9876543210', appId, externalId)).to.be.true;
	});

	it('should update existing externalIds when visitor already has some', async () => {
		const newExternalId = { userId: 'bsuid-789', username: '@newuser' };
		const updatedVisitor = {
			_id: 'visitor-789',
			token: 'token-789',
			username: 'guest-3',
			externalIds: { [appId]: newExternalId },
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.resolves(updatedVisitor);

		const result = await resolveVisitor({ source: appId, externalId: newExternalId, phone: '5555555555' });

		expect(result).to.deep.equal(updatedVisitor);
	});

	it('should return null when not found by external ID and no phone provided', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);

		const result = await resolveVisitor({ source: appId, externalId: { userId: 'bsuid-unknown' } });

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.called).to.be.false;
	});

	it('should return null when not found by external ID or phone', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.resolves(null);

		const result = await resolveVisitor({
			source: appId,
			externalId: { userId: 'bsuid-unknown' },
			phone: '0000000000',
		});

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.calledOnce).to.be.true;
	});

	it('should not attempt phone lookup when phone is empty string', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);

		const result = await resolveVisitor({
			source: appId,
			externalId: { userId: 'bsuid-123' },
			phone: '',
		});

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneAndAddExternalId.called).to.be.false;
	});
});
