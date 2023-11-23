import { api, ServiceClassInternal } from '@rocket.chat/core-services';
import type { IBannerService } from '@rocket.chat/core-services';
import type { BannerPlatform, IBanner, IBannerDismiss, Optional, IUser } from '@rocket.chat/core-typings';
import { Banners, BannersDismiss, Users } from '@rocket.chat/models';
import { v4 as uuidv4 } from 'uuid';

export class BannerService extends ServiceClassInternal implements IBannerService {
	protected name = 'banner';

	async getById(bannerId: string): Promise<null | IBanner> {
		return Banners.findOneById(bannerId);
	}

	async discardDismissal(bannerId: string): Promise<boolean> {
		const result = await Banners.findOneById(bannerId);

		if (!result) {
			return false;
		}

		const { _id, ...banner } = result;

		const snapshot = await this.create({ ...banner, snapshot: _id, active: false }); // create a snapshot

		await BannersDismiss.updateMany({ bannerId }, { $set: { bannerId: snapshot._id } });
		return true;
	}

	async create(doc: Optional<IBanner, '_id' | '_updatedAt'>): Promise<IBanner> {
		const bannerId = doc._id || uuidv4();

		doc.view.appId = 'banner-core';
		doc.view.viewId = bannerId;

		await Banners.create({
			...doc,
			_id: bannerId,
		});

		const banner = await Banners.findOneById(bannerId);
		if (!banner) {
			throw new Error('error-creating-banner');
		}

		void this.sendToUsers(banner);

		return banner;
	}

	async getBannersForUser(userId: string, platform: BannerPlatform, bannerId?: string): Promise<IBanner[]> {
		const user = await Users.findOneById<Pick<IUser, 'roles'>>(userId, {
			projection: { roles: 1 },
		});

		const { roles } = user || { roles: [] };

		const banners = await Banners.findActiveByRoleOrId(roles, platform, bannerId).toArray();

		const bannerIds = banners.map(({ _id }) => _id);

		const result = await BannersDismiss.findByUserIdAndBannerId<Pick<IBannerDismiss, 'bannerId'>>(userId, bannerIds, {
			projection: { bannerId: 1, _id: 0 },
		}).toArray();

		const dismissed = new Set(result.map(({ bannerId }) => bannerId));

		return banners.filter((banner) => !dismissed.has(banner._id));
	}

	async dismiss(userId: string, bannerId: string): Promise<boolean> {
		if (!userId || !bannerId) {
			throw new Error('Invalid params');
		}

		const banner = await Banners.findOneById(bannerId);
		if (!banner) {
			throw new Error('Banner not found');
		}

		const user = await Users.findOneById<Pick<IUser, 'username' | '_id'>>(userId, {
			projection: { username: 1 },
		});
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

		await BannersDismiss.insertOne(doc);

		return true;
	}

	async disable(bannerId: string): Promise<boolean> {
		const result = await Banners.disable(bannerId);

		if (result) {
			void api.broadcast('banner.disabled', bannerId);
			return true;
		}
		return false;
	}

	async enable(bannerId: string, doc: Partial<Omit<IBanner, '_id'>> = {}): Promise<boolean> {
		const result = await Banners.findOneById(bannerId);

		if (!result) {
			return false;
		}

		const { _id, ...banner } = result;

		const newBanner = { ...banner, ...doc, active: true };

		await Banners.updateOne({ _id }, { $set: newBanner }); // reenable the banner

		void this.sendToUsers({ _id, ...newBanner });

		return true;
	}

	async sendToUsers(banner: IBanner): Promise<boolean> {
		if (!banner.active) {
			return false;
		}

		// no roles set, so it should be sent to all users
		if (!banner.roles?.length) {
			void api.broadcast('banner.enabled', banner._id);
			return true;
		}

		const total = await Users.countActiveUsersInRoles(banner.roles);

		// if more than 100 users should receive the banner, send it to all users
		if (total > 100) {
			void api.broadcast('banner.enabled', banner._id);
			return true;
		}

		await Users.findActiveUsersInRoles(banner.roles, { projection: { _id: 1 } }).forEach((user) => {
			void api.broadcast('banner.user', user._id, banner);
		});

		return true;
	}
}
