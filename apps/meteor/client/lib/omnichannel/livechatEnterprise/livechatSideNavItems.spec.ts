import { registerLivechatEnterpriseSidebarItems, unregisterLivechatEnterpriseSidebarItems } from './livechatSideNavItems';
import { registerOmnichannelSidebarItem, unregisterSidebarItem } from '../../../views/omnichannel/sidebarItems';
import { hasPermission, hasAtLeastOnePermission } from '../../authorization';

jest.mock('../../../views/omnichannel/sidebarItems', () => ({
	registerOmnichannelSidebarItem: jest.fn(),
	unregisterSidebarItem: jest.fn(),
}));

jest.mock('../../authorization', () => ({
	hasPermission: jest.fn(),
	hasAtLeastOnePermission: jest.fn(),
}));

describe('registerLivechatEnterpriseSidebarItems', () => {
	it('should register all 7 enterprise sidebar items', () => {
		registerLivechatEnterpriseSidebarItems();

		expect(registerOmnichannelSidebarItem).toHaveBeenCalledTimes(7);
	});

	it('should register the Tags item with the correct href, icon, and permission check', () => {
		registerLivechatEnterpriseSidebarItems();

		expect(registerOmnichannelSidebarItem).toHaveBeenCalledWith(
			expect.objectContaining({
				href: '/omnichannel/tags',
				icon: 'tag',
				i18nLabel: 'Tags',
			}),
		);
	});

	it('should grant Tags item visibility only when the manage-livechat-tags permission is present', () => {
		registerLivechatEnterpriseSidebarItems();

		const tagsCall = jest.mocked(registerOmnichannelSidebarItem).mock.calls.find((call) => call[0].i18nLabel === 'Tags');
		const permissionGranted = tagsCall?.[0].permissionGranted;

		jest.mocked(hasPermission).mockReturnValue(true);
		expect(permissionGranted?.()).toBe(true);

		jest.mocked(hasPermission).mockReturnValue(false);
		expect(permissionGranted?.()).toBe(false);
	});
});

describe('unregisterLivechatEnterpriseSidebarItems', () => {
	it('should unregister all 7 items by their i18nLabel', () => {
		unregisterLivechatEnterpriseSidebarItems();

		expect(unregisterSidebarItem).toHaveBeenCalledTimes(7);
		expect(unregisterSidebarItem).toHaveBeenCalledWith('Tags');
	});
});
