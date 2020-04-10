import s from 'underscore.string';

import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatTag from '../models/LivechatTag';

export class LivechatTagRaw extends BaseRaw {
	findByNameRegexWithExceptionsAndConditions(searchTerm, exceptions = [], conditions = {}, options = {}) {
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const nameRegex = new RegExp(`^${ s.escapeRegExp(searchTerm).trim() }`, 'i');

		const query = {
			name: nameRegex,
			_id: {
				$nin: exceptions,
			},
			...conditions,
		};

		return this.find(query, options);
	}
}

export default new LivechatTagRaw(LivechatTag.model.rawCollection());
