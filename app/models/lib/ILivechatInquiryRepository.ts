import { IOptions } from './IOptions';

export interface ILivechatInquiryRepository {
	findOne(filter: {[key: string]: any}, options?: IOptions): any;
}
