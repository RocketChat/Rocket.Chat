import { BannerPlatform, IBanner } from '../../../definition/IBanner';

export interface IBannerService {
	getNewBannersForUser(userId: string, platform: BannerPlatform, bannerId?: string): Promise<IBanner[]>;
	create(banner: Omit<IBanner, '_id'>): Promise<IBanner>;
	dismiss(userId: string, bannerId: string): Promise<boolean>;
}
