import { UserStatus } from '@rocket.chat/core-typings';
import type { ICustomUserStatus } from '@rocket.chat/core-typings';

export type UserStatusDescriptor = {
	id: string;
	name: string;
	statusType: UserStatus;
	localizeName: boolean;
};

export type UserStatusStreamCallback = (data: { userStatusData: ICustomUserStatus }) => void;
export type UserStatusStreamer = (event: 'updateCustomUserStatus' | 'deleteCustomUserStatus', cb: UserStatusStreamCallback) => () => void;
export type UserStatusLister = () => Promise<ICustomUserStatus[] | null | undefined>;

export class UserStatuses implements Iterable<UserStatusDescriptor> {
	public invisibleAllowed = true;

	private store: Map<UserStatusDescriptor['id'], UserStatusDescriptor> = new Map(
		[UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE].map((status) => [
			status,
			{
				id: status,
				name: status,
				statusType: status,
				localizeName: true,
			},
		]),
	);

	public delete(id: string): void {
		this.store.delete(id);
	}

	public put(customUserStatus: UserStatusDescriptor): void {
		this.store.set(customUserStatus.id, customUserStatus);
	}

	public createFromCustom(customUserStatus: Omit<ICustomUserStatus, '_updatedAt'>): UserStatusDescriptor {
		if (!this.isValidType(customUserStatus.statusType)) {
			throw new Error('Invalid user status type');
		}

		return {
			name: customUserStatus.name,
			id: customUserStatus._id,
			statusType: customUserStatus.statusType as UserStatus,
			localizeName: false,
		};
	}

	public isValidType(type: string): type is UserStatus {
		return (Object.values(UserStatus) as string[]).includes(type);
	}

	public *[Symbol.iterator]() {
		for (const value of this.store.values()) {
			if (this.invisibleAllowed || value.statusType !== UserStatus.OFFLINE) {
				yield value;
			}
		}
	}

	public async sync(listCustomUserStatus: UserStatusLister) {
		const result = await listCustomUserStatus();
		if (!result) {
			return;
		}

		for (const customStatus of result) {
			this.put(this.createFromCustom(customStatus));
		}
	}

	public watch(stream: UserStatusStreamer, cb?: () => void) {
		const unsubscribeUpdate = stream('updateCustomUserStatus', (data) => {
			this.put(this.createFromCustom(data.userStatusData));
			cb?.();
		});

		const unsubscribeDelete = stream('deleteCustomUserStatus', (data) => {
			this.delete(data.userStatusData._id);
			cb?.();
		});

		return () => {
			unsubscribeUpdate();
			unsubscribeDelete();
		};
	}
}

export const userStatuses = new UserStatuses();
