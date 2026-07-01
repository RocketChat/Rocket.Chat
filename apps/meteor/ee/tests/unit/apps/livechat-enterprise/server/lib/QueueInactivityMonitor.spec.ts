import { expect } from 'chai';
import { describe, afterEach, beforeAll, beforeEach, it, vi } from 'vitest';

// Stubs are built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them. sinon is
// require()d inside the hoisted block because the top-level import has not executed at hoist time.
// NOTE: relative `vi.mock` specifiers are resolved relative to THIS spec file (not the source).
// `match` is exported from the hoisted sinon instance because matchers are instance-specific and a
// matcher from the top-level `import sinon` is not recognized by the hoisted stubs.
const {
	AgendaJobStub,
	AgendaStub,
	AgendaCtor,
	modelsMock,
	meteorMock,
	createIndexStub,
	mongoMock,
	livechatMock,
	settingsMock,
	i18nMock,
	match,
} = vi.hoisted(() => {
	const sinon = require('sinon');

	const AgendaJobStub = {
		schedule: sinon.stub(),
		unique: sinon.stub(),
		save: sinon.stub(),
	};
	const AgendaStub = {
		start: sinon.stub(),
		define: sinon.stub(),
		cancel: sinon.stub(),
		create: sinon.stub().returns(AgendaJobStub),
	};

	const modelsMock = {
		LivechatRooms: { findOneById: sinon.stub() },
		LivechatInquiry: { findOneById: sinon.stub() },
		Users: { findOneById: sinon.stub() },
	};
	const meteorMock = { Meteor: { startup: sinon.stub() } };
	const createIndexStub = sinon.stub();
	const mongoMock = {
		MongoInternals: {
			defaultRemoteCollectionDriver: sinon.stub().returns({
				mongo: { db: { collection: sinon.stub().returns({ createIndex: createIndexStub }) }, client: { db: sinon.stub() } },
			}),
		},
	};
	const livechatMock = { closeRoom: sinon.stub() };
	const settingsMock = { settings: { get: sinon.stub() } };
	const i18nMock = { i18n: { t: sinon.stub().returns('Closed automatically') } };

	return {
		AgendaJobStub,
		AgendaStub,
		AgendaCtor: sinon.stub().returns(AgendaStub),
		modelsMock,
		meteorMock,
		createIndexStub,
		mongoMock,
		livechatMock,
		settingsMock,
		i18nMock,
		match: sinon.match,
	};
});

vi.mock('@rocket.chat/agenda', () => ({ Agenda: AgendaCtor }));
vi.mock('@rocket.chat/models', () => modelsMock);
vi.mock('meteor/meteor', () => meteorMock);
vi.mock('meteor/mongo', () => mongoMock);
vi.mock('../../../../../../../app/livechat/server/lib/closeRoom', () => livechatMock);
vi.mock('../../../../../../../app/settings/server', () => settingsMock);
vi.mock('../../../../../../../server/lib/i18n', () => i18nMock);

const { OmnichannelQueueInactivityMonitorClass } = await import(
	'../../../../../../app/livechat-enterprise/server/lib/QueueInactivityMonitor'
);

describe('OmnichannelQueueInactivityMonitorClass', () => {
	afterEach(() => {
		modelsMock.Users.findOneById.reset();
	});
	describe('getRocketChatUser', () => {
		it('should return rocket.cat user', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.getRocketCatUser();

			expect(modelsMock.Users.findOneById.calledWith('rocket.cat')).to.be.true;
		});
	});

	describe('getName', () => {
		it('should return valid name', () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			const result = qclass.getName('inquiryId');
			expect(result).to.be.equal('Omnichannel-Queue-Inactivity-Monitor-inquiryId');
		});
	});

	describe('createIndex', () => {
		beforeAll(() => {
			createIndexStub.reset();
		});
		it('should create index', () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.createIndex();
			expect(createIndexStub.calledWith(match({ 'data.inquiryId': 1 }), match({ unique: true }))).to.be.true;
		});
	});

	describe('start', () => {
		beforeAll(() => {
			AgendaStub.start.reset();
		});
		it('should do nothing if its already running', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = true;
			await qclass.start();
			expect(AgendaStub.start.calledOnce).to.be.false;
		});
		it('should start scheduler', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.start();
			expect(AgendaStub.start.calledOnce).to.be.true;
			expect(qclass.running).to.be.true;
		});
	});

	describe('scheduleInquiry', () => {
		beforeEach(() => {
			AgendaStub.define.reset();
		});
		it('should schedule inquiry', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			const now = new Date();
			await qclass.scheduleInquiry('inquiryId', now);

			expect(AgendaStub.cancel.calledOnce).to.be.true;
			expect(AgendaStub.cancel.calledBefore(AgendaStub.define)).to.be.true;
			expect(AgendaStub.define.calledOnce).to.be.true;
			expect(AgendaJobStub.schedule.calledOnceWith(now)).to.be.true;
			expect(AgendaJobStub.unique.calledOnceWith(match({ 'data.inquiryId': 'inquiryId' }))).to.be.true;
		});
	});

	describe('stop', () => {
		beforeEach(() => {
			AgendaStub.cancel.reset();
		});
		it('should do nothing if process is already stopped', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = false;
			await qclass.stop();
			expect(AgendaStub.cancel.calledOnce).to.be.false;
		});
		it('should not call cancel twice if stop is called twice', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = true;
			await qclass.stop();
			await qclass.stop();
			expect(AgendaStub.cancel.calledOnce).to.be.true;
		});
		it('should cancel all inquiries and flag service as not running', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = true;
			await qclass.stop();
			expect(AgendaStub.cancel.calledOnce).to.be.true;
			expect(qclass.running).to.be.false;
		});
	});

	describe('stopInquiry', () => {
		beforeEach(() => {
			AgendaStub.cancel.reset();
		});
		it('should cancel inquiry', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.stopInquiry('inquiryId');
			expect(AgendaStub.cancel.calledOnce).to.be.true;
		});
	});

	describe('closeRoom', () => {
		beforeEach(() => {
			modelsMock.LivechatInquiry.findOneById.reset();
			modelsMock.LivechatRooms.findOneById.reset();
			livechatMock.closeRoom.reset();
		});
		it('should ignore the inquiry if its not in queue anymore', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'taken' });

			await qclass.closeRoom({ attrs: { data: { inquiryId: 'inquiryId' } } });
			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(livechatMock.closeRoom.notCalled).to.be.true;
		});
		it('should ignore an inquiry with no room', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'queued', rid: 'roomId' });
			modelsMock.LivechatRooms.findOneById.resolves(undefined);
			await qclass.closeRoom({ attrs: { data: { inquiryId: 'inquiryId' } } });

			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(modelsMock.LivechatRooms.findOneById.calledWith('roomId')).to.be.true;
			expect(livechatMock.closeRoom.notCalled).to.be.true;
		});
		it('should close a room', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'queued', rid: 'roomId' });
			modelsMock.LivechatRooms.findOneById.resolves({ _id: 'roomId' });
			modelsMock.Users.findOneById.resolves({ _id: 'rocket.cat' });

			await qclass.closeRoom({ attrs: { data: { inquiryId: 'inquiryId' } } });

			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(modelsMock.LivechatRooms.findOneById.calledWith('roomId')).to.be.true;
			expect(
				livechatMock.closeRoom.calledWith(
					match({
						comment: 'Closed automatically',
						room: { _id: 'roomId' },
						user: { _id: 'rocket.cat' },
					}),
				),
			);
		});
	});
});
