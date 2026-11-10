import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App, AppPricingPlan, AppSubscriptionStatus } from '@rocket.chat/core-typings';

import { appButtonProps, appMultiStatusProps, appStatusSpanProps } from './helpers';
import { createFakeApp } from '../../../tests/mocks/data';

const createApp = (overrides: Partial<App> = {}): App => {
	const app = createFakeApp({
		price: 0,
		purchaseType: 'buy',
		versionIncompatible: false,
		migrated: false,
		...overrides,
	});
	return {
		...app,
		subscriptionInfo: { ...app.subscriptionInfo, status: undefined as unknown as AppSubscriptionStatus, ...overrides.subscriptionInfo },
	};
};

const plan = (overrides: Partial<AppPricingPlan> = {}): AppPricingPlan => ({
	id: 'plan',
	enabled: true,
	price: 10,
	trialDays: 30,
	strategy: 'monthly',
	isPerSeat: false,
	...overrides,
});

const tiers = [{ perUnit: false, minimum: 1, maximum: 10, price: 10 }];

const buttonFor = (app: App, isAdminUser = true, endUserRequested = false) => appButtonProps({ ...app, isAdminUser, endUserRequested });

describe('appButtonProps', () => {
	it.each([
		['the app request flag', { requestedEndUser: true }, false],
		['the user request flag', {}, true],
	])('should show Requested to a user who is not an admin when %s is set', (_, overrides, endUserRequested) => {
		expect(buttonFor(createApp(overrides), false, endUserRequested)).toEqual({ action: 'request', label: 'Requested' });
	});

	it.each([
		[false, { action: 'update', icon: 'reload', label: 'Update' }],
		[true, { action: 'update', icon: 'warning', label: 'Update' }],
	])('should offer Update for an installed app with a newer version (incompatible: %s)', (versionIncompatible, expected) => {
		expect(buttonFor(createApp({ installed: true, version: '1.0.0', marketplaceVersion: '1.1.0', versionIncompatible }))).toEqual(expected);
	});

	it('should offer no action for an installed app that is up to date', () => {
		expect(buttonFor(createApp({ installed: true, version: '1.1.0', marketplaceVersion: '1.1.0' }))).toBeUndefined();
	});

	it('should not offer Update for an app that is not installed', () => {
		expect(buttonFor(createApp({ version: '1.0.0', marketplaceVersion: '1.1.0' }))).toEqual({ action: 'purchase', label: 'Install' });
	});

	it.each([
		['a purchased app', { isPurchased: true, price: 10 }, { action: 'install', label: 'Install' }],
		['a paid app', { price: 10 }, { action: 'purchase', label: 'Buy' }],
		['a free app', {}, { action: 'purchase', label: 'Install' }],
	])('should offer the right action for %s that is not installed, with a warning when it is incompatible', (_, overrides, expected) => {
		expect(buttonFor(createApp(overrides))).toEqual(expected);
		expect(buttonFor(createApp({ ...overrides, versionIncompatible: true }))).toEqual({ ...expected, icon: 'warning' });
	});

	it.each([
		['is incompatible', { versionIncompatible: true, pricingPlans: [plan()] }, { action: 'purchase', label: 'Subscribe', icon: 'warning' }],
		['has no trial', { pricingPlans: [plan({ trialDays: 0 })] }, { action: 'purchase', label: 'Subscribe' }],
		['is enterprise-only', { isEnterpriseOnly: true, pricingPlans: [plan()] }, { action: 'purchase', label: 'Subscribe' }],
		['has tiers in every plan', { pricingPlans: [plan({ tiers })] }, { action: 'purchase', label: 'See_Pricing' }],
		['has a trial in some plan', { pricingPlans: [plan(), plan({ trialDays: 0, tiers })] }, { action: 'purchase', label: 'Try_now' }],
		[
			'the workspace already subscribed to',
			{ subscriptionInfo: { status: 'active' } as App['subscriptionInfo'] },
			{ action: 'purchase', label: 'Buy' },
		],
	])('should offer the right subscription action for a subscription app that %s', (_, overrides, expected) => {
		expect(buttonFor(createApp({ purchaseType: 'subscription', price: 10, ...overrides }))).toEqual(expected);
	});
});

describe('appStatusSpanProps', () => {
	it('should give a mixed status across the cluster priority over the other badges', () => {
		const app = createApp({
			installed: true,
			status: AppStatus.MANUALLY_ENABLED,
			clusterStatus: [
				{ instanceId: 'a', status: AppStatus.MANUALLY_ENABLED },
				{ instanceId: 'b', status: AppStatus.MANUALLY_DISABLED },
			],
		});

		expect(appStatusSpanProps(app)).toMatchObject({ type: 'warning', icon: 'warning', label: 'Mixed_status' });
	});

	it.each([
		[AppStatus.AUTO_ENABLED, false, false, { label: 'Enabled' }],
		[AppStatus.MANUALLY_ENABLED, true, true, { label: 'Enabled' }],
		[AppStatus.MANUALLY_ENABLED, true, false, { label: 'Enabled*' }],
		[AppStatus.MANUALLY_DISABLED, false, false, { label: 'Disabled', type: 'danger' }],
		[AppStatus.MANUALLY_DISABLED, true, false, { label: 'Disabled*', type: 'danger' }],
	])('should label an installed app with status %s (migrated: %s, enterprise: %s)', (status, migrated, isEnterprise, expected) => {
		const app = createApp({
			installed: true,
			status,
			migrated,
			clusterStatus: [
				{ instanceId: 'a', status },
				{ instanceId: 'b', status },
			],
		});

		expect(appStatusSpanProps(app, isEnterprise)).toEqual(expected);
	});

	it('should show the trial badge for an app in its trial', () => {
		const app = createApp({ subscriptionInfo: { status: 'trialing' } as App['subscriptionInfo'] });

		expect(appStatusSpanProps(app)).toEqual({ icon: 'checkmark-circled', label: 'Trial_period' });
	});

	it.each([
		[
			{ totalUnseen: 1, totalSeen: 0 },
			{ label: 'request', type: 'primary' },
		],
		[
			{ totalUnseen: 2, totalSeen: 0 },
			{ label: 'requests', type: 'primary' },
		],
		[{ totalUnseen: 0, totalSeen: 1 }, { label: 'request' }],
		[{ totalUnseen: 0, totalSeen: 2 }, { label: 'requests' }],
	])('should show the request count %o in the requested list', (stats, expected) => {
		const app = createApp({ appRequestStats: { appId: 'app', ...stats } });

		expect(appStatusSpanProps(app, false, 'requested')).toEqual(expected);
	});

	it('should show Requested on the details page of a requested app', () => {
		const app = createApp({ appRequestStats: { appId: 'app', totalUnseen: 3, totalSeen: 0 } });

		expect(appStatusSpanProps(app, false, 'requested', true)).toEqual({ label: 'Requested' });
	});
});

describe('appMultiStatusProps', () => {
	const app = createApp({ installed: true, status: AppStatus.AUTO_ENABLED, versionIncompatible: true });

	it('should show the compatibility badge together with the status badge in lists', () => {
		expect(appMultiStatusProps(app, false, '', false).map(({ label }) => label)).toEqual(['Incompatible', 'Enabled']);
	});

	it('should leave the compatibility badge out on the details page', () => {
		expect(appMultiStatusProps(app, true, '', false).map(({ label }) => label)).toEqual(['Enabled']);
	});

	it('should show no compatibility badge for an app without compatibility data', () => {
		const withoutCompatibility = createApp({ installed: true, status: AppStatus.AUTO_ENABLED, versionIncompatible: undefined });

		expect(appMultiStatusProps(withoutCompatibility, false, '', false).map(({ label }) => label)).toEqual(['Enabled']);
	});
});
