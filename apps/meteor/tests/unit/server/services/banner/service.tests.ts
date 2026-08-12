import type { BannerPlatform, IBanner, IBannerDismiss } from '@rocket.chat/core-typings';
import { registerModel, BaseRaw } from '@rocket.chat/models';
import { expect } from 'chai';
import { afterEach, before, describe, it } from 'mocha';
import type { FindCursor, FindOptions } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const notifyOnUserChangeFake = sinon.fake();

const { BannerService } = proxyquire.noCallThru().load('../../../../../server/services/banner/service', {
	'../../lib/notifyListener': {
		notifyOnUserChange: notifyOnUserChangeFake,
	},
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

	override findOneById(): Promise<any> {
		return Promise.resolve(null);
	}
}

class BannerDismissModel extends BaseRaw<any> {
	findByUserIdAndBannerId(): FindCursor<Pick<IBannerDismiss, 'bannerId'>> {
		return {} as unknown as FindCursor<Pick<IBannerDismiss, 'bannerId'>>;
	}

	override insertOne(): Promise<any> {
		return Promise.resolve({ acknowledged: true });
	}
}

class UserModel extends BaseRaw<any> {
	override findOneById(): Promise<any> {
		return Promise.resolve({});
	}

	setBannerReadById(): Promise<any> {
		return Promise.resolve();
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
		notifyOnUserChangeFake.resetHistory();
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
		it('should dismiss a banner from Banners collection', async () => {
			const service = new BannerService();
			sinon.replace(userModel, 'findOneById', sinon.fake.returns(Promise.resolve({ _id: 'user-1', username: 'testuser' })));
			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve({ _id: 'banner-1' })));
			const insertOneMock = sinon.replace(bannerDismissModel, 'insertOne', sinon.fake.returns(Promise.resolve({})));
			const setBannerReadByIdMock = sinon.replace(
				userModel,
				'setBannerReadById',
				sinon.fake.returns(Promise.resolve({ modifiedCount: 1 })),
			);

			const result = await service.dismiss('user-1', 'banner-1');

			expect(result).to.be.true;
			expect(insertOneMock.callCount).to.be.equal(1);
			expect(setBannerReadByIdMock.callCount).to.be.equal(0);
			expect(notifyOnUserChangeFake.callCount).to.be.equal(0);
		});

		it('should dismiss a user banner (user.banners)', async () => {
			const service = new BannerService();
			sinon.replace(
				userModel,
				'findOneById',
				sinon.fake.returns(
					Promise.resolve({
						_id: 'user-1',
						username: 'testuser',
						banners: { 'versionUpdate-8_7_0': { id: 'versionUpdate-8_7_0' } },
					}),
				),
			);
			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve(null)));
			const insertOneMock = sinon.replace(bannerDismissModel, 'insertOne', sinon.fake.returns(Promise.resolve({})));
			const setBannerReadByIdMock = sinon.replace(
				userModel,
				'setBannerReadById',
				sinon.fake.returns(Promise.resolve({ modifiedCount: 1 })),
			);

			const result = await service.dismiss('user-1', 'versionUpdate-8_7_0');

			expect(result).to.be.true;
			expect(setBannerReadByIdMock.callCount).to.be.equal(1);
			expect(insertOneMock.callCount).to.be.equal(0);
			expect(notifyOnUserChangeFake.callCount).to.be.equal(1);
			expect(notifyOnUserChangeFake.firstCall.args[0]).to.be.deep.equal({
				id: 'user-1',
				clientAction: 'updated',
				diff: {
					'banners.versionUpdate-8_7_0.read': true,
				},
			});
		});

		it('should not send user notification if banner was concurrently removed before setBannerReadById', async () => {
			const service = new BannerService();
			sinon.replace(
				userModel,
				'findOneById',
				sinon.fake.returns(
					Promise.resolve({
						_id: 'user-1',
						username: 'testuser',
						banners: { 'versionUpdate-8_7_0': { id: 'versionUpdate-8_7_0' } },
					}),
				),
			);
			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve(null)));
			const setBannerReadByIdMock = sinon.replace(
				userModel,
				'setBannerReadById',
				sinon.fake.returns(Promise.resolve({ modifiedCount: 0 })),
			);

			const result = await service.dismiss('user-1', 'versionUpdate-8_7_0');

			expect(result).to.be.true;
			expect(setBannerReadByIdMock.callCount).to.be.equal(1);
			expect(notifyOnUserChangeFake.callCount).to.be.equal(0);
		});

		it('should throw error when banner is not found in Banners collection nor user.banners', async () => {
			const service = new BannerService();
			sinon.replace(userModel, 'findOneById', sinon.fake.returns(Promise.resolve({ _id: 'user-1', username: 'testuser' })));
			sinon.replace(bannersModel, 'findOneById', sinon.fake.returns(Promise.resolve(null)));

			try {
				await service.dismiss('user-1', 'non-existent-banner');
				expect.fail('Should have thrown an error');
			} catch (err: any) {
				expect(err.message).to.be.equal('Banner not found');
			}
		});
	});
});
