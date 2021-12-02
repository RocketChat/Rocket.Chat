import { Db } from 'mongodb';

import { IE2EEService } from '../../sdk/types/e2ee/IE2EEService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { E2EEKeyPair } from '../../sdk/types/e2ee/E2EEKeyPair';
import { IRoom } from '../../../definition/IRoom';
import { ISubscription } from '../../../definition/ISubscription';
import { IUser } from '../../../definition/IUser';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { canAccessRoom } from '../authorization/canAccessRoom';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';

export class E2EEService extends ServiceClass implements IE2EEService {
	protected readonly name = 'e2ee';

	private readonly Users: UsersRaw;

	private readonly Subscriptions: SubscriptionsRaw;

	private readonly Rooms: RoomsRaw;

	constructor(db: Db) {
		super();
		this.Users = new UsersRaw(db.collection('users'));
		this.Subscriptions = new SubscriptionsRaw(db.collection('rocketchat_subscription'), {
			Users: this.Users,
		});
		this.Rooms = new RoomsRaw(db.collection('rocketchat_room'));
	}

	async getUserKeys(uid: IUser['_id']): Promise<E2EEKeyPair | {}> {
		const user = await this.Users.findOne<Pick<IUser, 'e2e'>>({ _id: uid }, { projection: { e2e: 1 } });

		if (!user) {
			throw new Error('error-invalid-user');
		}

		if (!user.e2e || !user.e2e.public_key) {
			return {};
		}

		return {
			// eslint-disable-next-line @typescript-eslint/camelcase
			public_key: user.e2e.public_key,
			// eslint-disable-next-line @typescript-eslint/camelcase
			private_key: user.e2e.private_key,
		};
	}

	async setUserKeys(uid: IUser['_id'], keyPair: E2EEKeyPair): Promise<void> {
		await this.Users.update({ _id: uid }, {
			$set: {
				'e2e.public_key': keyPair.public_key,
				'e2e.private_key': keyPair.private_key,
			},
		});
	}

	async resetUserKeys(uid: IUser['_id']): Promise<void> {
		await this.Users.update({ _id: uid }, {
			$unset: {
				e2e: '',
			},
		});

		await this.Subscriptions.update({ 'u._id': uid }, {
			$unset: {
				E2EKey: '',
			},
		}, {
			multi: true,
		});

		await this.Users.unsetLoginTokens(uid);
	}

	async getRoomMembersWithoutPublicKey(uid: IUser['_id'], rid: IRoom['_id']): Promise<IUser[]> {
		if (!await canAccessRoom({ _id: rid }, { _id: uid })) {
			throw new Error('error-invalid-room');
		}

		const uids = await this.Subscriptions.find<{ u: Pick<ISubscription['u'], '_id'> }>({
			rid,
			E2EKey: {
				$exists: false,
			},
		}, { projection: { 'u._id': 1 } })
			.map((doc) => doc.u._id)
			.toArray();

		const users = await this.Users.find<IUser>({
			_id: {
				$in: uids,
			},
			'e2e.public_key': {
				$exists: 1,
			},
		}, { projection: { 'e2e.public_key': 1 } }).toArray();

		return users;
	}

	async setRoomKeyId(uid: IUser['_id'], rid: IRoom['_id'], keyId: Exclude<IRoom['e2eKeyId'], undefined>): Promise<void> {
		if (!await canAccessRoom({ _id: rid }, { _id: uid })) {
			throw new Error('error-invalid-room');
		}

		const room = await this.Rooms.findOneById<Pick<IRoom, '_id' | 'e2eKeyId'>>(rid, { projection: { e2eKeyId: 1 } });

		if (!room) {
			throw new Error('error-invalid-room');
		}

		if (room.e2eKeyId) {
			throw new Error('error-room-e2e-key-already-exists');
		}

		await this.Rooms.update({ _id: rid }, { $set: { e2eKeyId: keyId } });
	}

	async updateGroupKey(uid: IUser['_id'], params: {
		uid: IUser['_id'];
		rid: IRoom['_id'];
		keyId: Exclude<ISubscription['E2EKey'], undefined>;
	}): Promise<ISubscription | null> {
		const mySubscription = await this.Subscriptions.findOneByRoomIdAndUserId(params.rid, uid);
		if (!mySubscription) {
			return null;
		}

		const theirSubscription = await this.Subscriptions.findOneByRoomIdAndUserId(params.rid, params.uid);
		if (!theirSubscription) {
			return null;
		}

		await this.Subscriptions.update({ _id: theirSubscription._id }, { $set: { E2EKey: params.keyId } });

		return this.Subscriptions.findOneById(theirSubscription._id);
	}

	async requestSubscriptionKeys(uid: IUser['_id']): Promise<void> {
		const roomIds = await this.Subscriptions.find({
			'u._id': uid,
			E2EKey: {
				$exists: false,
			},
		})
			.map((doc) => doc.rid)
			.toArray();

		await this.Rooms.find({
			e2eKeyId: {
				$exists: true,
			},
			_id: {
				$in: roomIds,
			},
		}).forEach((room) => {
			this.emit('e2e.keyRequested', { rid: room._id, keyId: room.e2eKeyId });
		});
	}
}
