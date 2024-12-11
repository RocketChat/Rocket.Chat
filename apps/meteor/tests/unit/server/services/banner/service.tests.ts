import type { BannerPlatform, IBanner, IBannerDismiss } from '@rocket.chat/core-typings';
import { registerModel, BaseRaw } from '@rocket.chat/models';
import { expect } from 'chai';
import { afterEach, before, describe, it } from 'mocha';
import type { FindCursor, FindOptions } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { BannerService } = proxyquire.noCallThru().load('../../../../../server/services/banner/service', {});

class BannerModel extends BaseRaw<any> {
	findActiveByRoleOrId(
		_roles: string[],
		_platform: BannerPlatform,
		_bannerId?: string,
		_options?: FindOptions<IBanner>,
	): FindCursor<IBanner> {
		return {} as unknown as FindCursor<IBanner>;
	}
}

class BannerDismissModel extends BaseRaw<any> {
	findByUserIdAndBannerId(): FindCursor<Pick<IBannerDismiss, 'bannerId'>> {
		return {} as unknown as FindCursor<Pick<IBannerDismiss, 'bannerId'>>;
	}
}

class UserModel extends BaseRaw<any> {
	findOneById(): Promise<any> {
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
});
