import type { IAbacAttributeDefinition } from '@rocket.chat/apps-engine/definition/abac/AbacAttributes';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';
import type { RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';

/** Minimal interface covering the only AppManager capability used by Room */
interface IRoomManager {
	getBridges(): {
		getInternalBridge(): {
			doGetUsernamesOfRoomById(id: string): Promise<Array<string>>;
		};
	};
}

const PrivateManager = Symbol('RoomPrivateManager');

export class Room {
	public id: string | undefined;

	public displayName?: string;

	public slugifiedName: string | undefined;

	public type: RoomType | undefined;

	public creator: IUser | undefined;

	public isDefault?: boolean;

	public isReadOnly?: boolean;

	public displaySystemMessages?: boolean;

	public messageCount?: number;

	public createdAt?: Date;

	public updatedAt?: Date;

	public lastModifiedAt?: Date;

	public customFields?: { [key: string]: unknown };

	public userIds?: Array<string>;

	public abacAttributes?: IAbacAttributeDefinition[];

	private _USERNAMES: Promise<Array<string>> | undefined;

	private [PrivateManager]: IRoomManager | undefined;

	/**
	 * @deprecated
	 */
	public get usernames(): Promise<Array<string>> {
		if (!this.id) return Promise.resolve([]);

		if (!this._USERNAMES) {
			this._USERNAMES = this[PrivateManager]?.getBridges().getInternalBridge().doGetUsernamesOfRoomById(this.id);
		}

		return this._USERNAMES || Promise.resolve([]);
	}

	public set usernames(usernames) {}

	public constructor(room: IRoom, manager: IRoomManager) {
		Object.assign(this, room);

		Object.defineProperty(this, PrivateManager, {
			configurable: false,
			enumerable: false,
			writable: false,
			value: manager,
		});
	}

	get value(): object {
		return {
			id: this.id,
			displayName: this.displayName,
			slugifiedName: this.slugifiedName,
			type: this.type,
			creator: this.creator,
			isDefault: this.isDefault,
			isReadOnly: this.isReadOnly,
			displaySystemMessages: this.displaySystemMessages,
			messageCount: this.messageCount,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			lastModifiedAt: this.lastModifiedAt,
			customFields: this.customFields,
			userIds: this.userIds,
			abacAttributes: this.abacAttributes,
		};
	}

	public async getUsernames(): Promise<Array<string>> {
		// Get usernames
		if (!this._USERNAMES) {
			this._USERNAMES = await this[PrivateManager]?.getBridges().getInternalBridge().doGetUsernamesOfRoomById(this.id);
		}

		return this._USERNAMES || [];
	}

	public toJSON() {
		return this.value;
	}

	public toString() {
		return this.value;
	}

	public valueOf() {
		return this.value;
	}
}
