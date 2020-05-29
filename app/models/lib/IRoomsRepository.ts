import { IOptions } from './IOptions';

export interface IRoomsRepository {
	findOne(filter: {[key: string]: any}, options?: IOptions): any;
}
