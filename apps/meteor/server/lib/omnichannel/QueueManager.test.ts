import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

import type { ILivechatInquiryRecord, ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatInquiryStatus, OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatInquiryRaw, LivechatRoomsRaw, registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import type { Db, Document } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import proxyquire from 'proxyquire';

const guest = { _id: 'visitor-id', username: 'guest-1', token: 'visitor-token', activity: [] } as unknown as ILivechatVisitor;
const roomInfo = { source: { type: OmnichannelSourceType.WIDGET } };

describe('QueueManager.startConversation', () => {
	let replSet: MongoMemoryReplSet;
	let client: MongoClient;
	let db: Db;
	let startConversation: (room?: Partial<IOmnichannelRoom>) => Promise<{ room: IOmnichannelRoom; inquiry: ILivechatInquiryRecord }>;

	const failCommand = (mode: 'off' | 'alwaysOn' | { times: number }, data: Document) =>
		client.db('admin').command({ configureFailPoint: 'failCommand', mode, data });

	const stored = async () => ({
		rooms: await db.collection('rocketchat_room').find().toArray(),
		inquiries: await db.collection('rocketchat_livechat_inquiry').find().toArray(),
	});

	before(async () => {
		replSet = await MongoMemoryReplSet.create({
			replSet: { count: 1, storageEngine: 'wiredTiger', args: ['--setParameter', 'enableTestCommands=1'] },
		});
		client = await MongoClient.connect(replSet.getUri());
		db = client.db('queue_manager_test');

		const rooms = new LivechatRoomsRaw(db);
		const inquiries = new LivechatInquiryRaw(db);
		await Promise.all([rooms.createIndexes(), inquiries.createIndexes()]);
		registerModel('ILivechatRoomsModel', rooms);
		registerModel('ILivechatInquiryModel', inquiries);

		const databaseUtils = proxyquire.noCallThru().load('../../database/utils', {
			'meteor/mongo': {
				MongoInternals: { defaultRemoteCollectionDriver: () => ({ mongo: { db, client } }), NpmModules: { mongodb: { module: {} } } },
			},
		});

		const helper = proxyquire.noCallThru().load('./Helper', {
			'./QueueManager': {},
			'./RoutingManager': {},
			'./hooks': {},
			'./service-status': {},
			'./transfer': {},
			'../../hooks/messages/sendNotificationsOnMessage': {},
			'../../settings': {},
		});

		const { QueueManager } = proxyquire.noCallThru().load('./QueueManager', {
			'../../database/utils': databaseUtils,
			'./Helper': helper,
			'./RoutingManager': {},
			'./departmentsLib': {},
			'./hooks': {},
			'./service-status': {},
			'./settings': {},
			'../../../ee/server/lib/omnichannel/Helper': {},
			'../../hooks/messages/sendNotificationsOnMessage': {},
			'../../settings': {},
		});
		QueueManager.patchInquiryStatus(async () => LivechatInquiryStatus.READY);

		startConversation = (room = { fname: 'Guest 1' }) =>
			QueueManager.startConversation('rid', { _id: 'rid', t: 'l', ...room }, guest, roomInfo, undefined, 'hello');
	});

	after(async () => {
		await client.close();
		await replSet.stop();
	});

	beforeEach(async () => {
		await db.collection('rocketchat_room').deleteMany({});
		await db.collection('rocketchat_livechat_inquiry').deleteMany({});
	});

	afterEach(async () => {
		await failCommand('off', {});
	});

	it('should store the room and its inquiry and return both', async () => {
		const { room, inquiry } = await startConversation();

		expect(room).to.include({ _id: 'rid', fname: 'Guest 1' });
		expect(inquiry).to.include({ rid: 'rid', name: 'Guest 1', message: 'hello', status: LivechatInquiryStatus.READY });
		const { rooms, inquiries } = await stored();
		expect(rooms.map(({ _id }) => _id)).to.deep.equal(['rid']);
		expect(inquiries.map(({ _id }) => _id)).to.deep.equal([inquiry._id]);
	});

	it('should leave no room behind and rethrow when the inquiry cannot be created', async () => {
		await expect(startConversation({})).to.be.rejectedWith('error-invalid-inquiry-name');

		expect(await stored()).to.deep.equal({ rooms: [], inquiries: [] });
	});

	it('should retry up to three transient failures and store the conversation once', async () => {
		await failCommand({ times: 3 }, { failCommands: ['findAndModify'], errorCode: 112, errorLabels: ['TransientTransactionError'] });

		const { inquiry } = await startConversation();

		const { rooms, inquiries } = await stored();
		expect(rooms.map(({ _id }) => _id)).to.deep.equal(['rid']);
		expect(inquiries.map(({ _id }) => _id)).to.deep.equal([inquiry._id]);
	});

	it('should throw error-failed-to-start-conversation and store nothing after a fourth transient failure', async () => {
		await failCommand({ times: 4 }, { failCommands: ['findAndModify'], errorCode: 112, errorLabels: ['TransientTransactionError'] });

		await expect(startConversation()).to.be.rejectedWith('error-failed-to-start-conversation');

		expect(await stored()).to.deep.equal({ rooms: [], inquiries: [] });
	});

	it('should reject with the abort error and not retry when the commit fails', async () => {
		await failCommand('alwaysOn', { failCommands: ['commitTransaction'], errorCode: 50, errorLabels: ['UnknownTransactionCommitResult'] });

		await expect(startConversation()).to.be.rejectedWith('Cannot call abortTransaction after calling commitTransaction');

		expect(await stored()).to.deep.equal({ rooms: [], inquiries: [] });
	});
});
