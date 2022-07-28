import { BannerPlatform, IBanner, Optional } from '@rocket.chat/core-typings';

export interface IBannerService {
	getBannersForUser(userId: string, platform: BannerPlatform, bannerId?: string): Promise<IBanner[]>;
	create(banner: Optional<IBanner, '_id'>): Promise<IBanner>;
	dismiss(userId: string, bannerId: string): Promise<boolean>;
	discardDismissal(bannerId: string): Promise<boolean>;
	getById(bannerId: string): Promise<null | IBanner>;
	disable(bannerId: string): Promise<boolean>;
	enable(bannerId: string, doc?: Partial<Omit<IBanner, '_id'>>): Promise<boolean>;
}
