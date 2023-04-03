import type { IFile } from './definition';

type Action = 'insert' | 'remove' | 'update';

type Actions = Partial<Record<Action, (userId: string, file: IFile, fields?: string[], modifiers?: string[]) => boolean>>;

export class StorePermissions {
	private actions: Actions;

	constructor(options: Actions = {}) {
		// Default options
		this.actions = {
			...options,
		};

		// Check options
		if (this.actions.insert && typeof this.actions.insert !== 'function') {
			throw new TypeError('StorePermissions: insert is not a function');
		}
		if (this.actions.remove && typeof this.actions.remove !== 'function') {
			throw new TypeError('StorePermissions: remove is not a function');
		}
		if (this.actions.update && typeof this.actions.update !== 'function') {
			throw new TypeError('StorePermissions: update is not a function');
		}
	}

	check(action: Action, userId: string, file: IFile, fields?: string[], modifiers?: string[]) {
		if (typeof this.actions[action] === 'function') {
			return this.actions[action]?.(userId, file, fields, modifiers);
		}
		return true; // by default allow all
	}

	checkInsert(userId: string, file: IFile, _fields?: string[], _modifiers?: string[]) {
		return this.check('insert', userId, file);
	}

	checkRemove(userId: string, file: IFile, _fields?: string[], _modifiers?: string[]) {
		return this.check('remove', userId, file);
	}

	checkUpdate(userId: string, file: IFile, fields?: string[], modifiers?: string[]) {
		return this.check('update', userId, file, fields, modifiers);
	}
}
