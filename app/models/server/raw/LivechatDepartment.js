import _ from 'underscore';
import s from 'underscore.string';

import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentRaw extends BaseRaw {
	findInIds(departmentsIds, options) {
		const query = { _id: { $in: departmentsIds } };
		return this.find(query, options);
	}

	findByNameRegexWithExceptionsAndConditions(searchTerm, exceptions, conditions, options) {
		if (exceptions == null) { exceptions = []; }
		if (conditions == null) { conditions = {}; }
		if (options == null) { options = {}; }
		if (!_.isArray(exceptions)) {
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
