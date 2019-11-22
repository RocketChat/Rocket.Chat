import s from 'underscore.string';

import { BaseRaw } from './BaseRaw';

export class MentionGroupsRaw extends BaseRaw {
	findByNameContaining(name, options, exceptions = []) {
		const nameRegex = new RegExp(`^${ s.escapeRegExp(name).trim() }`, 'i');

		const query = {
			name: nameRegex,
			_id: {
				$nin: exceptions,
			},
		};

		return this.find(query, options);
	}
}
