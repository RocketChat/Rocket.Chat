import { registerOmnichannelSidebarItem, unregisterSidebarItem } from '../../../views/omnichannel/sidebarItems';
import { hasPermission, hasAtLeastOnePermission } from '../../authorization';
import type { Item } from '../../createSidebarItems';
import { registerLivechatEnterpriseSidebarItems, unregisterLivechatEnterpriseSidebarItems } from './livechatSideNavItems';

jest.mock('../../../views/omnichannel/sidebarItems', () => ({
	registerOmnichannelSidebarItem: jest.fn(),
	unregisterSidebarItem: jest.fn(),
}));

jest.mock('../../authorization', () => ({
	hasPermission: jest.fn(),
	hasAtLeastOnePermission: jest.fn(),
}));

describe('livechatEnterpriseSideNavItems', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should register all enterprise sidebar items including Tags', () => {
		registerLivechatEnterpriseSidebarItems();

		expect(registerOmnichannelSidebarItem).toHaveBeenCalledTimes(7);

		const registeredItems = jest.mocked(registerOmnichannelSidebarItem).mock.calls.map(([item]) => item as Item);
		const labels = registeredItems.map((item) => item.i18nLabel);
		const hrefs = registeredItems.map((item) => item.href);

		expect(labels).toEqual([
			'Reports',
			'Livechat_Monitors',
			'Units',
			'Canned_Responses',
			'Tags',
			'SLA_Policies',
			'Priorities',
		]);
		expect(hrefs).toEqual([
			'/omnichannel/reports',
			'/omnichannel/monitors',
			'/omnichannel/units',
			'/omnichannel/canned-responses',
			'/omnichannel/tags',
			'/omnichannel/sla-policies',
			'/omnichannel/priorities',
		]);
	});

	it('should verify permission callbacks for registered enterprise items', () => {
		registerLivechatEnterpriseSidebarItems();

		const registeredItems = jest.mocked(registerOmnichannelSidebarItem).mock.calls.map(([item]) => item as Item);
		const itemsByLabel = Object.fromEntries(registeredItems.map((item) => [item.i18nLabel, item]));

		jest.mocked(hasPermission).mockReturnValue(true);
		jest.mocked(hasAtLeastOnePermission).mockReturnValue(true);

		expect(itemsByLabel.Tags.permissionGranted?.()).toBe(true);
		expect(hasPermission).toHaveBeenCalledWith('manage-livechat-tags');

		expect(itemsByLabel.Reports.permissionGranted?.()).toBe(true);
		expect(hasPermission).toHaveBeenCalledWith('view-livechat-reports');

		expect(itemsByLabel.Livechat_Monitors.permissionGranted?.()).toBe(true);
		expect(hasPermission).toHaveBeenCalledWith('manage-livechat-monitors');

		expect(itemsByLabel.Units.permissionGranted?.()).toBe(true);
		expect(hasPermission).toHaveBeenCalledWith('manage-livechat-units');

		expect(itemsByLabel.Canned_Responses.permissionGranted?.()).toBe(true);
		expect(hasPermission).toHaveBeenCalledWith('manage-livechat-canned-responses');

		expect(itemsByLabel.SLA_Policies.permissionGranted?.()).toBe(true);
		expect(hasAtLeastOnePermission).toHaveBeenCalledWith('manage-livechat-sla');

		expect(itemsByLabel.Priorities.permissionGranted?.()).toBe(true);
		expect(hasAtLeastOnePermission).toHaveBeenCalledWith('manage-livechat-priorities');
	});

	it('should unregister all enterprise sidebar items by label', () => {
		unregisterLivechatEnterpriseSidebarItems();

		expect(unregisterSidebarItem).toHaveBeenCalledTimes(7);
		const unregisterLabels = jest.mocked(unregisterSidebarItem).mock.calls.map(([label]) => label);

		expect(unregisterLabels).toEqual([
			'Reports',
			'Livechat_Monitors',
			'Units',
			'Canned_Responses',
			'Tags',
			'SLA_Policies',
			'Priorities',
		]);
	});

	it('should survive repeated register/unregister cycles', () => {
		// The startup wiring (startup/livechatEnterprise.ts) calls register on
		// the livechat-enterprise feature toggle up and unregister on down, so a
		// logout/login transition exercises one full down/up cycle. Directly
		// asserting those cycles here keeps the behavior covered without an E2E
		// test; the feature-toggle side itself stays thin.
		registerLivechatEnterpriseSidebarItems();
		expect(registerOmnichannelSidebarItem).toHaveBeenCalledTimes(7);

		unregisterLivechatEnterpriseSidebarItems();
		expect(unregisterSidebarItem).toHaveBeenCalledTimes(7);

		registerLivechatEnterpriseSidebarItems();
		expect(registerOmnichannelSidebarItem).toHaveBeenCalledTimes(14);
	});
});
