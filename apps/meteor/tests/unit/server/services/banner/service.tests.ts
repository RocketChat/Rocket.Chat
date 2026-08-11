import type { BannerPlatform, IBanner, IBannerDismiss } from '@rocket.chat/core-typings';
import { registerModel, BaseRaw } from '@rocket.chat/models';
import { expect } from 'chai';
import { afterEach, before, describe, it } from 'mocha';
import type { FindCursor, FindOptions } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const notifyOnUserChange = sinon.stub();

const { BannerService } = proxyquire.noCallThru().load('../../../../../server/services/banner/service', {
	'../../lib/notifyListener': { notifyOnUserChange },
});

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

	override insertOne(): Promise<any> {
		return Promise.resolve({});
	}
}

class UserModel extends BaseRaw<any> {
	override findOneById(): Promise<any> {
		return Promise.resolve({});
	}

	setBannerReadById(_userId: string, _bannerId: string): Promise<any> {
		return Promise.resolve({ matchedCount: 0, modifiedCount: 0 });
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

	afterEach(() => {
		notifyOnUserChange.reset();
		sinon.restore();
	});

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

	describe('dismiss', () => {
		const FAKE_BANNER: IBanner = {
			_id: 'fake-id',
			view: {
				appId: 'fake-app-id',
				viewId: 'fake-view-id',
			},
		} as IBanner;

		it('should throw an error if the params are invalid', async () => {
			const service = new BannerService();

			await expect(service.dismiss('', FAKE_BANNER._id)).to.be.rejectedWith('Invalid params');
			await expect(service.dismiss('a-fake-user-id', '')).to.be.rejectedWith('Invalid params');
		});

		it('should dismiss a banner from the banners collection', async () => {
			const service = new BannerService();

			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve(FAKE_BANNER)));
			sinon.replace(userModel, 'findOneById', sinon.fake.returns(Promise.resolve({ _id: 'a-fake-user-id', username: 'fake.user' })));
			const insertOneMock = sinon.replace(bannerDismissModel, 'insertOne', sinon.fake.returns(Promise.resolve({})));
			const setBannerReadByIdMock = sinon.replace(userModel, 'setBannerReadById', sinon.fake.returns(Promise.resolve({})));

			await expect(service.dismiss('a-fake-user-id', FAKE_BANNER._id)).to.eventually.be.true;

			expect(insertOneMock.callCount).to.be.equal(1);
			expect(insertOneMock.firstCall.firstArg).to.deep.include({
				userId: 'a-fake-user-id',
				bannerId: FAKE_BANNER._id,
				dismissedBy: { _id: 'a-fake-user-id', username: 'fake.user' },
			});
			expect(setBannerReadByIdMock.callCount).to.be.equal(0);
			expect(notifyOnUserChange.callCount).to.be.equal(0);
		});

		it("should mark the banner as read on the user's record if it is not on the banners collection", async () => {
			const service = new BannerService();

			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve(null)));
			const insertOneMock = sinon.replace(bannerDismissModel, 'insertOne', sinon.fake.returns(Promise.resolve({})));
			const setBannerReadByIdMock = sinon.replace(
				userModel,
				'setBannerReadById',
				sinon.fake.returns(Promise.resolve({ matchedCount: 1, modifiedCount: 1 })),
			);

			await expect(service.dismiss('a-fake-user-id', 'a-user-banner-id')).to.eventually.be.true;

			expect(setBannerReadByIdMock.callCount).to.be.equal(1);
			expect(setBannerReadByIdMock.calledWith('a-fake-user-id', 'a-user-banner-id')).to.be.true;
			expect(insertOneMock.callCount).to.be.equal(0);

			expect(notifyOnUserChange.callCount).to.be.equal(1);
			expect(notifyOnUserChange.firstCall.firstArg).to.be.deep.equal({
				id: 'a-fake-user-id',
				clientAction: 'updated',
				diff: { 'banners.a-user-banner-id.read': true },
			});
		});

		it("should succeed if the banner on the user's record was already read", async () => {
			const service = new BannerService();

			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve(null)));
			sinon.replace(userModel, 'setBannerReadById', sinon.fake.returns(Promise.resolve({ matchedCount: 1, modifiedCount: 0 })));

			await expect(service.dismiss('a-fake-user-id', 'a-user-banner-id')).to.eventually.be.true;
		});

		it('should throw an error if the banner is not found', async () => {
			const service = new BannerService();

			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve(null)));
			sinon.replace(userModel, 'setBannerReadById', sinon.fake.returns(Promise.resolve({ matchedCount: 0, modifiedCount: 0 })));

			await expect(service.dismiss('a-fake-user-id', 'an-unknown-banner-id')).to.be.rejectedWith('Banner not found');

			expect(notifyOnUserChange.callCount).to.be.equal(0);
		});
	});
});
