import { Db } from 'mongodb';
import _ from 'underscore';

import { IOmnichannelVoipService } from '../../sdk/types/IOmnichannelVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IVoipConnectorResult } from '../../../definition/IVoipConnectorResult';
import { IVoipExtensionBase } from '../../../definition/IVoipExtension';
import { Logger } from '../../lib/logger/Logger';
import { Voip } from '../../sdk';
import { IAgentExtensionMap, IOmnichannelVoipServiceResult } from '../../../definition/ILivechatVoipServiceResult';
/**
 * Note (Amol) :
 * Why cant we get the direct access to the model here and have to work with
 * raw model? This is still a server code. So ideally it should have access to the model
 * like the REST apis have.
 *
 * Check this during the code review and after code review is done, delete this comment.
 */
import { UsersRaw } from '../../../app/models/server/raw/Users';

export class OmnichannelVoipService extends ServiceClass implements IOmnichannelVoipService {
	protected name = 'omnichannel-voip';

	private logger: Logger;

	private users: UsersRaw;

	constructor(db: Db) {
		super();
		this.users = new UsersRaw(db.collection('users'));
		this.logger = new Logger('OmnichannelVoipService');
	}

	getConfiguration(): any {
		return {};
	}

	private async getAllocatedExtesionAllocationData(projections: { [P in keyof IUser]: number }): Promise<Array<IUser>> {
		const roles: string[] = ['livechat-agent', 'livechat-manager', 'admin'];
		const options = {
			sort: {
				username: 1,
			},
			projection: {
			},
		};
		options.projection = projections;
		const query = {
			extension: { $exists: true },
		};
		const data = await this.users.findUsersInRolesWithQuery(roles, query, options).toArray();
		return data;
	}

	async getAvailableExtensions(): Promise<IOmnichannelVoipServiceResult> {
		const allExtensions = Promise.await(Voip.getExtensionList()) as IVoipConnectorResult;
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			extension: 1,
		});
		const filtered = _.difference(_.pluck(allExtensions.result as IVoipExtensionBase [], 'extension'),
			_.pluck(allocatedExtensions, 'extension'));
		this.logger.debug({ msg: 'getAvailableExtensions()', found: filtered.length });
		const result: IOmnichannelVoipServiceResult = {
			result: filtered,
		};
		this.logger.debug({ msg: 'getAvailableExtensions() result length ',
			length: result.result.length,
		});
		return Promise.resolve(result);
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
		const result: IOmnichannelVoipServiceResult = {
			result: _.map(allocatedExtensions, (user: any) => {
				const agent: IAgentExtensionMap = {
					_id: user._id,
					agentName: user.username,
					extension: user.extension,
				};
				return agent;
			}),
		};
		return Promise.resolve(result);
	}
}
