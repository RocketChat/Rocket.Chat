import { BaseRaw } from './BaseRaw';

export class IntegrationsRaw extends BaseRaw {
	findOneByIdAndCreatedByIfExists({ _id, createdBy }) {
		const query = {
			_id,
		};
		if (createdBy) {
			query['_createdBy._id'] = createdBy;
		}

		return this.findOne(query);
	}
}
