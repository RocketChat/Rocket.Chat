import type * as UiKit from '@rocket.chat/ui-kit';
import * as z from 'zod';

import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';
import { TimestampSchema } from './utils';

export enum BannerPlatform {
	Web = 'web',
	Mobile = 'mobile',
}

export const IBannerSchema = z.object({
	_id: z.string(),
	_updatedAt: TimestampSchema.optional(),
	platform: z.array(z.enum(BannerPlatform)), // pĺatforms a banner could be shown
	expireAt: TimestampSchema, // date when banner should not be shown anymore
	startAt: TimestampSchema, // start date a banner should be presented
	/** @deprecated a new `selector` field should be created for filtering instead */
	roles: z.array(z.string()).optional().meta({ deprecated: true }),
	createdBy: z.union([
		z.object({
			_id: z.string(),
			username: z.string().optional(),
		}),
		z.enum(['cloud', 'system']),
	]),
	createdAt: TimestampSchema,
	view: z.custom<UiKit.BannerView>(),
	active: z.boolean().optional(),
	inactivedAt: TimestampSchema.optional(),
	snapshot: z.string().optional(),
	dictionary: z.record(z.string(), z.record(z.string(), z.string())).optional(),
	surface: z.enum(['banner', 'modal']),
});

export interface IBanner extends z.infer<typeof IBannerSchema> {}

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
