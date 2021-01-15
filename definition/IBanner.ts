import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';

export enum BannerPlatform {
	Web = 'web',
	Mobile = 'mobile',
}

export interface IBanner extends IRocketChatRecord {
	platform: BannerPlatform[]; // pĺatforms a banner could be shown
	expireAt: Date; // date when banner should not be shown anymore
	startAt: Date; // start date a banner should be presented
	roles?: string[]; // only show the banner this roles
	createdBy: Pick<IUser, '_id' | 'username' >;
	createdAt: Date;
}
