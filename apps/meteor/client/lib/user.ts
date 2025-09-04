import type { IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { create } from 'zustand';

import { PublicSettings, Users } from '../stores';

/**
 * @ignore do not consume this store directly
 */
export const userIdStore = create<IUser['_id'] | undefined>(() => undefined);

export const getUserId = () => userIdStore.getState();

export const getUser = () => {
	const userId = getUserId();
	if (!userId) return undefined;
	return Users.state.get(userId);
};

export const USER_ID_KEY = 'Meteor.userId' as const;

export const LOGIN_TOKEN_KEY = 'Meteor.loginToken' as const;

export const LOGIN_TOKEN_EXPIRES_KEY = 'Meteor.loginTokenExpires' as const;

class UserStorage extends Emitter<{ change: void }> implements Storage {
	private storage: Storage;

	constructor() {
		super();

		const forgetUserSessionOnWindowClose = PublicSettings.state.get('Accounts_ForgetUserSessionOnWindowClose')?.value ?? false;
		this.storage = forgetUserSessionOnWindowClose ? sessionStorage : localStorage;

		PublicSettings.use.subscribe((state) => {
			const forgetUserSessionOnWindowClose = state.get('Accounts_ForgetUserSessionOnWindowClose')?.value ?? false;
			const newStorage = forgetUserSessionOnWindowClose ? sessionStorage : localStorage;
			if (this.storage === newStorage) return;
			this.storage = newStorage;
			this.emit('change');
		});

		window.addEventListener('storage', (event) => {
			if (event.storageArea !== this.storage) return;
			this.emit('change');
		});
	}

	get length(): number {
		return this.storage.length;
	}

	clear(): void {
		this.storage.clear();
	}

	getItem(key: string): string | null {
		return this.storage.getItem(key);
	}

	key(index: number): string | null {
		return this.storage.key(index);
	}

	removeItem(key: string): void {
		this.storage.removeItem(key);
		this.emit('change');
	}

	setItem(key: string, value: string): void {
		this.storage.setItem(key, value);
		this.emit('change');
	}
}

export const userStorage = new UserStorage();
