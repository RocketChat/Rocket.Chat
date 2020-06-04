import { IOptions } from './IOptions';

export interface ISubscriptionRepository {
	findOne(filter: {[key: string]: any}, options?: IOptions): any;
	find(filter: {[key: string]: any}, options?: IOptions): any;
}
