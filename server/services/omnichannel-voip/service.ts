import { Db } from 'mongodb';
import _ from 'underscore';

import { IOmnichannelVoipService } from '../../sdk/types/IOmnichannelVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IVoipExtensionBase } from '../../../definition/IVoipExtension';
import { Logger } from '../../lib/logger/Logger';
import { Voip } from '../../sdk';
import { IOmnichannelVoipServiceResult } from '../../../definition/IOmnichannelVoipServiceResult';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IUser } from '../../../definition/IUser';

export class OmnichannelVoipService extends ServiceClass implements IOmnichannelVoipService {
	protected name = 'omnichannel-voip';

	private logger: Logger;

	private users: UsersRaw;

	constructor(db: Db) {
		super();
		this.users = new UsersRaw(db.collection('users'));
		this.logger = new Logger('OmnichannelVoipService');
	}

	private async getAllocatedExtesionAllocationData(projection: Partial<{ [P in keyof IUser]: number }>): Promise<IUser[]> {
		const roles: string[] = ['livechat-agent', 'livechat-manager', 'admin'];
		const options = {
			sort: {
				username: 1,
			},
			projection,
		};

		const query = {
			extension: { $exists: true },
		};
		return this.users.findUsersInRolesWithQuery(roles, query, options).toArray();
	}

	getConfiguration(): any {
		return {};
	}

	async getFreeExtensions(): Promise<IOmnichannelVoipServiceResult> {
		const allExtensions = await Voip.getExtensionList();
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			extension: 1,
		});
		const filtered = _.difference(_.pluck(allExtensions.result as IVoipExtensionBase [], 'extension'),
			_.pluck(allocatedExtensions, 'extension')) as string[];
		this.logger.debug({ msg: 'getAvailableExtensions()', found: filtered.length });
		return {
			result: filtered,
		};
	}

	async getExtensionAllocationDetails(): Promise<IOmnichannelVoipServiceResult> {
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			username: 1,
			roles: 1,
			extension: 1,
		});
		this.logger.debug({ msg: 'getExtensionAllocationDetails() all extension length ',
			length: allocatedExtensions.length,
		});
		return {
			result: allocatedExtensions.map((user: any) => ({
				_id: user._id,
				agentName: user.username,
				extension: user.extension,
			})),
		};
	}
}
