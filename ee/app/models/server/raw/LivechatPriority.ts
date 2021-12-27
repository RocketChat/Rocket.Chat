import { FindOneOptions } from 'mongodb';

import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatPriority from '../models/LivechatPriority';
import { ILivechatPriority } from '../../../../../definition/ILIvechatPriority';

export class LivechatPriorityRaw extends BaseRaw<ILivechatPriority> {
	findOneByIdOrName(_idOrName: string, options: FindOneOptions<ILivechatPriority>): Promise<ILivechatPriority | null> {
		const query = {
			$or: [{
				_id: _idOrName,
			}, {
				name: _idOrName,
			}],
		};

		return this.findOne(query, options);
	}
}

// @ts-expect-error
export default new LivechatPriorityRaw(LivechatPriority.model.rawCollection());
