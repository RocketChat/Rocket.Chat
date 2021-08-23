import { BannerPlatform, IBanner } from '../../../definition/IBanner';
import { Optional } from '../../../definition/utils';

export interface IBannerService {
	getBannersForUser(userId: string, platform: BannerPlatform, bannerId?: string): Promise<IBanner[]>;
	create(banner: Optional<IBanner, '_id'>): Promise<IBanner>;
	dismiss(userId: string, bannerId: string): Promise<boolean>;
	disable(bannerId: string): Promise<boolean>;
	enable(bannerId: string, doc?: Partial<Omit<IBanner, '_id'>>, keepDismiss?: boolean): Promise<boolean>;
}
