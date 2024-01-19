import { UserStatus } from '@rocket.chat/core-typings';
import type { ICustomUserStatus } from '@rocket.chat/core-typings';

export type UserStatusDescriptor = {
	id: string;
	name: string;
	statusType: UserStatus;
	localizeName: boolean;
};

export class UserStatuses implements Iterable<UserStatusDescriptor> {
	private store: Map<UserStatusDescriptor['id'], UserStatusDescriptor> = new Map(
		Object.values(UserStatus).map((status) => [
			status,
			{
				id: status,
				name: status,
				localizeName: true,
				statusType: status,
			},
		]),
	);

	public delete(id: string): void {
		this.store.delete(id);
	}

	public put(customUserStatus: UserStatusDescriptor): void {
		this.store.set(customUserStatus.id, customUserStatus);
	}

	public createFromCustom(customUserStatus: ICustomUserStatus): UserStatusDescriptor {
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
		return type in UserStatus;
	}

	public [Symbol.iterator](): Iterator<UserStatusDescriptor> {
		return this.store.values();
	}
}

export const userStatuses = new UserStatuses();
