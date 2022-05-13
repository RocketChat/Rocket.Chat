import { Cursor } from 'mongodb';

import { AtLeastOne } from './AtLeastOne';
import { IGateway } from './IGateway';
import { IRocketChatRecord } from './IRocketChatRecord';
import { IPaginationOptions, IQueryOptions } from './ITeam';
import { IUser } from './IUser';

export interface IGatewayData {
	gateway: IGateway['_id'];
	quantity: number;
	amount: number;
	currency: string;
}

export interface ITransaction extends IRocketChatRecord {
	hash: string;
	gateway: IGateway['_id'];
	transactionCode: string;
	quantity: number;
	amount: number;
	currency: string;
	status: 'success' | 'cancelled' | 'error';
	updatedBy?: IUser['_id'];
	createdAt: Date;
	createdBy: IUser['_id'];
	gatewayData: IGatewayData;
}

export type ITransactionLean = Omit<ITransaction, '_id' | '_updatedAt' | 'createdAt'>;

export type ITransactionCreateParams = Omit<ITransactionLean, 'hash' | 'transactionCode' | 'gatewayData' | 'updatedBy'>;

export type ITransactionUpdateParams = AtLeastOne<Omit<ITransactionLean, 'hash' | 'transactionCode'>>;

export interface ITransactionService {
	create(params: ITransactionCreateParams): Promise<ITransaction>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<ITransaction>): Cursor<ITransaction>;
	update(transactionId: ITransaction['_id'], params: ITransactionUpdateParams): Promise<ITransaction>;
	delete(transactionId: ITransaction['_id']): Promise<void>;
	getTransaction(transactionId: ITransaction['_id']): Promise<ITransaction>;
}
