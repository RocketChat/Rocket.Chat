import { Cursor } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IGatewayService, IGatewayCreateParams, IGateway, IGatewayUpdateParams } from '../../../definition/IGateway';
import { GatewaysRaw } from '../../../app/models/server/raw/Gateways';
import { IPaginationOptions, IQueryOptions } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { GatewaysModel } from '../../../app/models/server/raw';

export class GatewayService extends ServiceClassInternal implements IGatewayService {
	protected name = 'gateway';

	private GatewayModel: GatewaysRaw = GatewaysModel;

	async create(params: IGatewayCreateParams): Promise<IGateway> {
		const createData: InsertionModel<IGateway> = {
			...new CreateObject(),
			...params,
		};
		const result = await this.GatewayModel.insertOne(createData);
		return this.GatewayModel.findOneById(result.insertedId);
	}

	async delete(gatewayId: string): Promise<void> {
		await this.getGateway(gatewayId);
		await this.GatewayModel.removeById(gatewayId);
	}

	async getGateway(gatewayId: string): Promise<IGateway> {
		const gateway = await this.GatewayModel.findOneById(gatewayId);
		if (!gateway) {
			throw new Error('gateway-does-not-exist');
		}
		return gateway;
	}

	async update(gatewayId: string, params: IGatewayUpdateParams): Promise<IGateway> {
		await this.getGateway(gatewayId);
		const query = {
			_id: gatewayId,
		};
		const updateData = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.GatewayModel.updateOne(query, { $set: updateData });
		return this.GatewayModel.findOneById(result.upsertedId._id.toHexString());
	}

	list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IGateway> = { sort: {} },
	): Cursor<IGateway> {
		return this.GatewayModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
	}
}
