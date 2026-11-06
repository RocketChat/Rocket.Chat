import { afterEach, before, beforeEach, describe, it } from 'node:test';

import type { BannerPlatform, IBanner, IBannerDismiss, Optional } from '@rocket.chat/core-typings';
import { registerModel, BaseRaw } from '@rocket.chat/models';
import { expect } from 'chai';
import type { FindCursor, FindOptions, UpdateResult } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { BannerService } = proxyquire.noCallThru().load('./service', {});

class BannerModel extends BaseRaw<any> {
	docs = new Map<string, IBanner>();

	findActiveByRoleOrId(
		_roles: string[],
		_platform: BannerPlatform,
		_bannerId?: string,
		_options?: FindOptions<IBanner>,
	): FindCursor<IBanner> {
		return {} as unknown as FindCursor<IBanner>;
	}

	override findOneById(bannerId: string): Promise<IBanner | null> {
		return Promise.resolve(this.docs.get(bannerId) ?? null);
	}

	// Mirrors BannersRaw.createOrUpdate: an upsert whose `$set` rewrites the whole
	// document, including `_updatedAt` (BaseRaw.updateOne sets it), so even an
	// unchanged banner looks modified to the database.
	createOrUpdate(banner: IBanner): Promise<UpdateResult> {
		this.docs.set(banner._id, { ...this.docs.get(banner._id), active: true, ...banner, _updatedAt: new Date() });
		return Promise.resolve({ matchedCount: 1, modifiedCount: 1, upsertedCount: 0 } as unknown as UpdateResult);
	}
}

class BannerDismissModel extends BaseRaw<any> {
	findByUserIdAndBannerId(): FindCursor<Pick<IBannerDismiss, 'bannerId'>> {
		return {} as unknown as FindCursor<Pick<IBannerDismiss, 'bannerId'>>;
	}
}

class UserModel extends BaseRaw<any> {
	override findOneById(): Promise<any> {
		return Promise.resolve({});
	}
}

function findCursorFactory<T>(items: T[]): FindCursor<T> {
	return {
		toArray: () => Promise.resolve(items),
	} as unknown as FindCursor<T>;
}

const bannersModel = new BannerModel({ collection: () => ({}) } as unknown as any, 'banner');
const bannerDismissModel = new BannerDismissModel({ collection: () => ({}) } as unknown as any, 'banner_dismiss');
const userModel = new UserModel({ collection: () => ({}) } as unknown as any, 'user');

describe('Banners service', () => {
	before(() => {
		registerModel('IBannersModel', bannersModel);
		registerModel('IBannersDismissModel', bannerDismissModel);
		registerModel('IUsersModel', userModel);
	});

	afterEach(() => sinon.restore());

	it('should be defined', () => {
		const service = new BannerService();

		expect(service).to.be.an('object');
	});

	describe('getBannersForUser', () => {
		const FAKE_BANNER: IBanner = {
			_id: 'fake-id',
			view: {
				appId: 'fake-app-id',
				viewId: 'fake-view-id',
			},
		} as IBanner;

		const A_SECOND_FAKE_BANNER: IBanner = {
			_id: 'fake-id-2',
			surface: 'modal',
			view: {},
		} as IBanner;

		it('should return the banners a user has access to', async () => {
			const service = new BannerService();
			const findActiveByRoleOrIdMock = sinon.replace(
				bannersModel,
				'findActiveByRoleOrId',
				sinon.fake.returns(findCursorFactory<IBanner>([FAKE_BANNER])),
			);
			const findByUserIdAndBannerIdMock = sinon.replace(
				bannerDismissModel,
				'findByUserIdAndBannerId',
				sinon.fake.returns(findCursorFactory<Pick<IBannerDismiss, 'bannerId'>>([])),
			);

			sinon.replace(userModel, 'findOneById', sinon.fake.returns(Promise.resolve({})));
			const banners = await service.getBannersForUser('a-fake-id', 'web');

			expect(findActiveByRoleOrIdMock.callCount).to.be.equal(1);
			expect(findByUserIdAndBannerIdMock.callCount).to.be.equal(1);

			expect(banners).to.be.an('array');
			expect(banners).to.have.lengthOf(1);
			expect(banners[0].view.viewId).to.be.equal(FAKE_BANNER.view.viewId);
			expect(banners[0].surface).to.be.equal('banner');
		});

		it('should return all the banners that were not dismissed', async () => {
			const service = new BannerService();
			const findActiveByRoleOrIdMock = sinon.replace(
				bannersModel,
				'findActiveByRoleOrId',
				sinon.fake.returns(findCursorFactory<IBanner>([FAKE_BANNER])),
			);
			const findByUserIdAndBannerIdMock = sinon.replace(
				bannerDismissModel,
				'findByUserIdAndBannerId',
				sinon.fake.returns(findCursorFactory<Pick<IBannerDismiss, 'bannerId'>>([{ bannerId: FAKE_BANNER._id }])),
			);

			sinon.replace(userModel, 'findOneById', sinon.fake.returns(Promise.resolve({})));

			const banners = await service.getBannersForUser('a-fake-id', 'web');

			expect(findActiveByRoleOrIdMock.callCount).to.be.equal(1);
			expect(findByUserIdAndBannerIdMock.callCount).to.be.equal(1);

			expect(banners).to.be.an('array');
			expect(banners).to.have.lengthOf(0);
		});

		it('should use the _id as viewId if not set', async () => {
			const service = new BannerService();
			const findActiveByRoleOrIdMock = sinon.replace(
				bannersModel,
				'findActiveByRoleOrId',
				sinon.fake.returns(findCursorFactory<IBanner>([A_SECOND_FAKE_BANNER])),
			);
			const findByUserIdAndBannerIdMock = sinon.replace(
				bannerDismissModel,
				'findByUserIdAndBannerId',
				sinon.fake.returns(findCursorFactory<Pick<IBannerDismiss, 'bannerId'>>([])),
			);

			sinon.replace(userModel, 'findOneById', sinon.fake.returns(Promise.resolve({})));

			const banners = await service.getBannersForUser('a-fake-id', 'web');

			expect(findActiveByRoleOrIdMock.callCount).to.be.equal(1);
			expect(findByUserIdAndBannerIdMock.callCount).to.be.equal(1);

			expect(banners).to.be.an('array');
			expect(banners).to.have.lengthOf(1);
			expect(banners[0].view.viewId).to.be.equal(A_SECOND_FAKE_BANNER._id);
			expect(banners[0].surface).to.be.equal('modal');
		});
	});

	// A workspace sync re-sends the same cloud announcements every 12 hours.
	describe('create', () => {
		beforeEach(() => bannersModel.docs.clear());

		const announcement = (overrides: Partial<IBanner> = {}): Optional<IBanner, '_id' | '_updatedAt'> => ({
			_id: 'cloud-announcement-id',
			platform: ['web'],
			startAt: new Date('2026-11-01T00:00:00.000Z'),
			expireAt: new Date('2026-12-01T00:00:00.000Z'),
			createdBy: { _id: 'cloud-announcements' },
			createdAt: new Date('2026-11-01T00:00:00.000Z'),
			view: { appId: 'cloud-announcements-core', viewId: 'cloud-announcement' },
			surface: 'banner',
			dictionary: { default: { title: 'Monthly mobile notification limit reached' } },
			...overrides,
		});

		it('should send a banner to users when it is created', async () => {
			const service = new BannerService();
			const sendToUsers = sinon.spy(service, 'sendToUsers');

			await service.create(announcement());

			expect(sendToUsers.callCount).to.be.equal(1);
		});

		it('should not write or send a banner whose content did not change', async () => {
			const service = new BannerService();
			const createOrUpdate = sinon.spy(bannersModel, 'createOrUpdate');
			const sendToUsers = sinon.spy(service, 'sendToUsers');

			await service.create(announcement());
			const writesAfterFirst = createOrUpdate.callCount;

			await service.create(announcement());
			await service.create(announcement());

			expect(createOrUpdate.callCount).to.be.equal(writesAfterFirst);
			expect(sendToUsers.callCount).to.be.equal(1);
		});

		it('should send a banner whose content changed', async () => {
			const service = new BannerService();
			const sendToUsers = sinon.spy(service, 'sendToUsers');

			await service.create(announcement());
			await service.create(announcement({ dictionary: { default: { title: 'Something else' } } }));

			expect(sendToUsers.callCount).to.be.equal(2);
		});

		it('should send a banner that is currently inactive', async () => {
			const service = new BannerService();
			const sendToUsers = sinon.spy(service, 'sendToUsers');

			await service.create(announcement());
			(bannersModel.docs.get('cloud-announcement-id') as IBanner).active = false;

			await service.create(announcement());

			expect(sendToUsers.callCount).to.be.equal(2);
		});
	});
});
