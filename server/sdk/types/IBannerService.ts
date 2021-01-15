import { BannerPlatform, IBanner } from '../../../definition/IBanner';

export interface IBannerService {
	getNewBannersForUser(userId: string, platform: BannerPlatform): Promise<IBanner[]>;
	create(banner: Omit<IBanner, '_id'>): Promise<IBanner>;
	dismiss(userId: string, bannerId: string): Promise<boolean>;
}
