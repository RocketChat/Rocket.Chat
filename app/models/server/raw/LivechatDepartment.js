import s from 'underscore.string';

import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentRaw extends BaseRaw {
	findInIds(departmentsIds, options) {
		const query = { _id: { $in: departmentsIds } };
		return this.find(query, options);
	}

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

	findByBusinessHourId(businessHourId, options) {
		const query = { businessHourId };
		return this.find(query, options);
	}

	findEnabledByBusinessHourId(businessHourId, options) {
		const query = { businessHourId, enabled: true };
		return this.find(query, options);
	}

	addBusinessHourToDepartamentsByIds(ids = [], businessHourId) {
		const query = {
			_id: { $in: ids },
		};

		const update = {
			$set: {
				businessHourId,
			},
		};

		return this.col.update(query, update, { multi: true });
	}

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids = [], businessHourId) {
		const query = {
			_id: { $in: ids },
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.col.update(query, update, { multi: true });
	}

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId) {
		const query = {
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.col.update(query, update, { multi: true });
	}
}
