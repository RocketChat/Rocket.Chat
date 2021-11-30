import { Db } from 'mongodb';

import { IE2EService } from '../../sdk/types/e2e/IE2EService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { E2EKeyPair } from '../../sdk/types/e2e/E2EKeyPair';
import { IRoom } from '../../../definition/IRoom';
import { ISubscription } from '../../../definition/ISubscription';
import { IUser } from '../../../definition/IUser';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { canAccessRoom } from '../authorization/canAccessRoom';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';

export class E2EService extends ServiceClass implements IE2EService {
	protected readonly name = 'e2e';

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

	async getUserKeys(uid: IUser['_id']): Promise<E2EKeyPair | {}> {
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

	async setUserKeys(uid: IUser['_id'], keyPair: E2EKeyPair): Promise<void> {
		await this.Users.update({ _id: uid }, {
			$set: {
				'e2e.public_key': keyPair.public_key,
				'e2e.private_key': keyPair.private_key,
			},
		});
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
}
