import type * as UiKit from '@rocket.chat/ui-kit';

import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export enum BannerPlatform {
	Web = 'web',
	Mobile = 'mobile',
}

type Dictionary = {
	[lng: string]: {
		[key: string]: string;
	};
};

export interface IBanner extends IRocketChatRecord {
	platform: BannerPlatform[]; // pĺatforms a banner could be shown
	expireAt: Date; // date when banner should not be shown anymore
	startAt: Date; // start date a banner should be presented
	/** @deprecated a new `selector` field should be created for filtering instead */
	roles?: string[]; // only show the banner to this roles
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
	view: UiKit.BannerView;
	active?: boolean;
	inactivedAt?: Date;
	snapshot?: string;

	dictionary?: Dictionary;
	surface: 'banner' | 'modal';
}

export type InactiveBanner = IBanner & {
	active: false;
	inactivedAt: Date;
};

export const isInactiveBanner = (banner: IBanner): banner is InactiveBanner => banner.active === false;

export interface IBannerDismiss extends IRocketChatRecord {
	userId: IUser['_id']; // user receiving the banner dismissed
	bannerId: IBanner['_id']; // banner dismissed
	dismissedAt: Date; // when is was dismissed
	dismissedBy: Pick<IUser, '_id' | 'username'>; // who dismissed (usually the same as userId)
}
