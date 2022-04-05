import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatPriority from '../models/LivechatPriority';

export class LivechatPriorityRaw extends BaseRaw {
	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}
}

export default new LivechatPriorityRaw(LivechatPriority.model.rawCollection());
