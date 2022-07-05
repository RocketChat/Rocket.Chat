/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Karl STEIN
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { _ } from 'meteor/underscore';

/**
 * Store permissions
 */
export class StorePermissions {
	constructor(options) {
		// Default options
		options = _.extend(
			{
				insert: null,
				remove: null,
				update: null,
			},
			options,
		);

		// Check options
		if (options.insert && typeof options.insert !== 'function') {
			throw new TypeError('StorePermissions: insert is not a function');
		}
		if (options.remove && typeof options.remove !== 'function') {
			throw new TypeError('StorePermissions: remove is not a function');
		}
		if (options.update && typeof options.update !== 'function') {
			throw new TypeError('StorePermissions: update is not a function');
		}

		// Public attributes
		this.actions = {
			insert: options.insert,
			remove: options.remove,
			update: options.update,
		};
	}

	/**
	 * Checks the permission for the action
	 * @param action
	 * @param userId
	 * @param file
	 * @param fields
	 * @param modifiers
	 * @return {*}
	 */
	check(action, userId, file, fields, modifiers) {
		if (typeof this.actions[action] === 'function') {
			return this.actions[action](userId, file, fields, modifiers);
		}
		return true; // by default allow all
	}

	/**
	 * Checks the insert permission
	 * @param userId
	 * @param file
	 * @returns {*}
	 */
	checkInsert(userId, file) {
		return this.check('insert', userId, file);
	}

	/**
	 * Checks the remove permission
	 * @param userId
	 * @param file
	 * @returns {*}
	 */
	checkRemove(userId, file) {
		return this.check('remove', userId, file);
	}

	/**
	 * Checks the update permission
	 * @param userId
	 * @param file
	 * @param fields
	 * @param modifiers
	 * @returns {*}
	 */
	checkUpdate(userId, file, fields, modifiers) {
		return this.check('update', userId, file, fields, modifiers);
	}
}
