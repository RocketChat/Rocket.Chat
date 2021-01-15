import { Db } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { BannersRaw } from '../../../app/models/server/raw/Banners';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IBannerService } from '../../sdk/types/IBannerService';
import { BannerPlatform, IBanner } from '../../../definition/IBanner';

export class BannerService extends ServiceClass implements IBannerService {
	protected name = 'banner';

	private Banners: BannersRaw;

	private Users: UsersRaw;

	constructor(db: Db) {
		super();

		this.Banners = new BannersRaw(db.collection('rocketchat_banner'));
		this.Users = new UsersRaw(db.collection('users'));
	}

	async create(doc: Omit<IBanner, '_id'>): Promise<IBanner> {
		const { insertedId } = await this.Banners.insertOne(doc);

		const banner = await this.Banners.findOneById(insertedId);

		if (!banner) {
			throw new Error('error-creating-banner');
		}

		return banner;
	}

	async getNewBannersForUser(userId: string, platform: BannerPlatform): Promise<IBanner[]> {
		const { roles, bannersDismissed } = await this.Users.findOneById(userId, { projection: { roles: 1, bannersDismissed: 1 } });

		const banners = await this.Banners.findActiveByRoleAndPlatformExcluding(roles, platform, bannersDismissed).toArray();

		return banners;
	}

	async dismiss(userId: string, bannerId: string): Promise<boolean> {
		const banner = await this.Banners.findOneById(bannerId);
		if (!banner) {
			throw new Error('Banner not found');
		}

		const user = await this.Users.findOneById(userId, { projection: { roles: 1 } });
		if (!user) {
			throw new Error('User not found');
		}

		const result = await this.Users.addBannerDismissById(userId, bannerId);
		if (!result) {
			throw new Error('Error dismissing banner');
		}

		return true;
	}
}
