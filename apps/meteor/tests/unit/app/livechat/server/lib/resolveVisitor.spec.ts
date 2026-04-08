import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatVisitors: {
		findOneByExternalId: sinon.stub(),
		findOneVisitorByPhoneOrEmailAndAddExternalId: sinon.stub(),
	},
};

const { resolveVisitor } = proxyquire.noCallThru().load('../../../../../../app/livechat/server/lib/resolveVisitor.ts', {
	'@rocket.chat/models': modelsMock,
});

// Mock app ID (UUID format as used by Rocket.Chat apps)
const appId = 'a1b2c3d4-e5f6-4890-8bcd-ef1234567890';

describe('resolveVisitor', () => {
	beforeEach(() => {
		modelsMock.LivechatVisitors.findOneByExternalId.reset();
		modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.reset();
	});

	it('should return visitor when found by external ID without contact data fallback', async () => {
		const existingVisitor = {
			_id: 'visitor-123',
			token: 'token-123',
			username: 'guest-1',
			externalIds: [{ appId, entityId: 'bsuid-123' }],
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(existingVisitor);

		const result = await resolveVisitor({
			appId,
			externalId: { entityId: 'bsuid-123' },
			contactData: { phone: '1234567890' },
		});

		expect(result).to.deep.equal(existingVisitor);
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnceWith('bsuid-123')).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.called).to.be.false;
	});

	it('should find by phone, enrich with external ID, and return visitor when not found by external ID', async () => {
		const externalId = { entityId: 'bsuid-456', metadata: { username: '@johndoe' } };
		const contactData = { phone: '9876543210' };
		const updatedVisitor = {
			_id: 'visitor-456',
			token: 'token-456',
			username: 'guest-2',
			externalIds: [{ appId, ...externalId }],
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.resolves(updatedVisitor);

		const result = await resolveVisitor({ appId, externalId, contactData });

		expect(result).to.deep.equal(updatedVisitor);
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.calledOnceWith(contactData, appId, externalId)).to.be
			.true;
	});

	it('should find by email, enrich with external ID, and return visitor when not found by external ID', async () => {
		const externalId = { entityId: 'bsuid-email', metadata: { username: '@emailuser' } };
		const contactData = { email: 'test@example.com' };
		const updatedVisitor = {
			_id: 'visitor-email',
			token: 'token-email',
			username: 'guest-email',
			externalIds: [{ appId, ...externalId }],
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.resolves(updatedVisitor);

		const result = await resolveVisitor({ appId, externalId, contactData });

		expect(result).to.deep.equal(updatedVisitor);
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.calledOnceWith(contactData, appId, externalId)).to.be
			.true;
	});

	it('should update existing externalIds when visitor already has some', async () => {
		const newExternalId = { entityId: 'bsuid-789', metadata: { username: '@newuser' } };
		const contactData = { phone: '5555555555' };
		const updatedVisitor = {
			_id: 'visitor-789',
			token: 'token-789',
			username: 'guest-3',
			externalIds: [{ appId, ...newExternalId }],
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.resolves(updatedVisitor);

		const result = await resolveVisitor({ appId, externalId: newExternalId, contactData });

		expect(result).to.deep.equal(updatedVisitor);
	});

	it('should find visitor by entityId regardless of appId (different app version)', async () => {
		const differentAppId = 'different-app-id-from-old-version';
		const existingVisitor = {
			_id: 'visitor-cross-app',
			token: 'token-cross-app',
			username: 'guest-cross',
			externalIds: [{ appId: differentAppId, entityId: 'bsuid-shared' }],
		};

		modelsMock.LivechatVisitors.findOneByExternalId.resolves(existingVisitor);

		const result = await resolveVisitor({
			appId,
			externalId: { entityId: 'bsuid-shared' },
		});

		expect(result).to.deep.equal(existingVisitor);
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnceWith('bsuid-shared')).to.be.true;
	});

	it('should return null when not found by external ID and no contact data provided', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);

		const result = await resolveVisitor({ appId, externalId: { entityId: 'bsuid-unknown' } });

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.called).to.be.false;
	});

	it('should return null when not found by external ID or contact data', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);
		modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.resolves(null);

		const result = await resolveVisitor({
			appId,
			externalId: { entityId: 'bsuid-unknown' },
			contactData: { phone: '0000000000' },
		});

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneByExternalId.calledOnce).to.be.true;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.calledOnce).to.be.true;
	});

	it('should not attempt lookup when phone is empty string', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);

		const result = await resolveVisitor({
			appId,
			externalId: { entityId: 'bsuid-123' },
			contactData: { phone: '' },
		});

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.called).to.be.false;
	});

	it('should not attempt lookup when email is empty string', async () => {
		modelsMock.LivechatVisitors.findOneByExternalId.resolves(null);

		const result = await resolveVisitor({
			appId,
			externalId: { entityId: 'bsuid-123' },
			contactData: { email: '' },
		});

		expect(result).to.be.null;
		expect(modelsMock.LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId.called).to.be.false;
	});
});
