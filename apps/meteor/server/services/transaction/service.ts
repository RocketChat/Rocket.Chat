import { Cursor } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import {
	ITransactionService,
	ITransactionCreateParams,
	ITransaction,
	ITransactionUpdateParams,
	IGatewayData,
} from '../../../definition/ITransaction';
import { TransactionsRaw } from '../../../app/models/server/raw/Transactions';
import { IPaginationOptions, IQueryOptions } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { TransactionsModel } from '../../../app/models/server/raw';

const createHash = (length: number): string => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

const createLongRandomNumber = (): string => {
	let foo = '';
	for (let i = 0; i < 19; ++i) foo += Math.floor(Math.random() * 10);
	return foo;
};

export class TransactionService extends ServiceClassInternal implements ITransactionService {
	protected name = 'transaction';

	private TransactionModel: TransactionsRaw = TransactionsModel;

	async create(params: ITransactionCreateParams): Promise<ITransaction> {
		const gatewayData: IGatewayData = {
			gateway: params.gateway,
			quantity: params.quantity,
			amount: params.amount,
			currency: params.currency,
		};
		const createData: InsertionModel<ITransaction> = {
			...new CreateObject(),
			...params,
			gatewayData,
			hash: createHash(6),
			transactionCode: createLongRandomNumber(),
		};
		const result = await this.TransactionModel.insertOne(createData);
		return this.TransactionModel.findOneById(result.insertedId);
	}

	async delete(transactionId: string): Promise<void> {
		await this.getTransaction(transactionId);
		await this.TransactionModel.removeById(transactionId);
	}

	async getTransaction(transactionId: string): Promise<ITransaction> {
		const transaction = await this.TransactionModel.findOneById(transactionId);
		if (!transaction) {
			throw new Error('transaction-does-not-exist');
		}
		return transaction;
	}

	async update(transactionId: string, params: ITransactionUpdateParams): Promise<ITransaction> {
		await this.getTransaction(transactionId);
		const query = {
			_id: transactionId,
		};
		const updateData = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.TransactionModel.updateOne(query, { $set: updateData });
		return this.TransactionModel.findOneById(result.upsertedId._id.toHexString());
	}

	list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<ITransaction> = { sort: {} },
	): Cursor<ITransaction> {
		return this.TransactionModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
	}
}
