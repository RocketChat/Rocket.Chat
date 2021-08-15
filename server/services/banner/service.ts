import { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { BannersRaw } from '../../../app/models/server/raw/Banners';
import { BannersDismissRaw } from '../../../app/models/server/raw/BannersDismiss';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IBannerService } from '../../sdk/types/IBannerService';
import { BannerPlatform, IBanner, IBannerDismiss } from '../../../definition/IBanner';
import { api } from '../../sdk/api';
import { IUser } from '../../../definition/IUser';

export class BannerService extends ServiceClass implements IBannerService {
	protected name = 'banner';

	private Banners: BannersRaw;

	private BannersDismiss: BannersDismissRaw;

	private Users: UsersRaw;

	constructor(db: Db) {
		super();

		this.Banners = new BannersRaw(db.collection('rocketchat_banner'));
		this.BannersDismiss = new BannersDismissRaw(db.collection('rocketchat_banner_dismiss'));
		this.Users = new UsersRaw(db.collection('users'));
	}

	async create(doc: Omit<IBanner, '_id'>): Promise<IBanner> {
		const bannerId = uuidv4();

		doc.view.appId = 'banner-core';
		doc.view.viewId = bannerId;

		const invalidPlatform = doc.platform?.some((platform) => !Object.values(BannerPlatform).includes(platform));
		if (invalidPlatform) {
			throw new Error('Invalid platform');
		}

		if (doc.startAt > doc.expireAt) {
			throw new Error('Start date cannot be later than expire date');
		}

		if (doc.expireAt < new Date()) {
			throw new Error('Cannot create banner already expired');
		}

		await this.Banners.insertOne({
			...doc,
			_id: bannerId,
		});

		const banner = await this.Banners.findOneById(bannerId);
		if (!banner) {
			throw new Error('error-creating-banner');
		}

		api.broadcast('banner.new', banner._id);

		return banner;
	}

	async getNewBannersForUser(userId: string, platform: BannerPlatform, bannerId?: string): Promise<IBanner[]> {
		const user = await this.Users.findOneById<Pick<IUser, 'roles'>>(userId, { projection: { roles: 1 } });

		const { roles } = user || { roles: [] };

		const banners = await this.Banners.findActiveByRoleOrId(roles, platform, bannerId).toArray();

		const bannerIds = banners.map(({ _id }) => _id);

		const result = await this.BannersDismiss.findByUserIdAndBannerId<Pick<IBannerDismiss, 'bannerId'>>(userId, bannerIds, { projection: { bannerId: 1, _id: 0 } }).toArray();

		const dismissed = new Set(result.map(({ bannerId }) => bannerId));

		return banners.filter((banner) => !dismissed.has(banner._id));
	}

	async dismiss(userId: string, bannerId: string): Promise<boolean> {
		if (!userId || !bannerId) {
			throw new Error('Invalid params');
		}

		const banner = await this.Banners.findOneById(bannerId);
		if (!banner) {
			throw new Error('Banner not found');
		}

		const user = await this.Users.findOneById<Pick<IUser, 'username' | '_id'>>(userId, { projection: { username: 1 } });
		if (!user) {
			throw new Error('User not found');
		}

		const dismissedBy = {
			_id: user._id,
			username: user.username,
		};

		const today = new Date();

		const doc = {
			userId,
			bannerId,
			dismissedBy,
			dismissedAt: today,
			_updatedAt: today,
		};

		await this.BannersDismiss.insertOne(doc);

		return true;
	}
}
