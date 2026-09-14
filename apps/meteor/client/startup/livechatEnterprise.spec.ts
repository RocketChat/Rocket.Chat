import { onToggledFeature } from '../lib/onToggledFeature';
import {
	registerLivechatEnterpriseSidebarItems,
	unregisterLivechatEnterpriseSidebarItems,
} from '../lib/omnichannel/livechatEnterprise/livechatSideNavItems';

import './livechatEnterprise';

jest.mock('../lib/onToggledFeature', () => ({
	onToggledFeature: jest.fn(),
}));

jest.mock('../lib/omnichannel/livechatEnterprise/livechatSideNavItems', () => ({
	registerLivechatEnterpriseSidebarItems: jest.fn(),
	unregisterLivechatEnterpriseSidebarItems: jest.fn(),
}));

const flushDynamicImport = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('livechat enterprise startup', () => {
	it('registers and unregisters sidebar items as the licensed feature is toggled', async () => {
		expect(onToggledFeature).toHaveBeenCalledWith(
			'livechat-enterprise',
			expect.objectContaining({ up: expect.any(Function), down: expect.any(Function) }),
		);
		const [, handlers] = jest.mocked(onToggledFeature).mock.calls[0];

		handlers.up?.();
		await flushDynamicImport();
		expect(registerLivechatEnterpriseSidebarItems).toHaveBeenCalledTimes(1);

		handlers.down?.();
		await flushDynamicImport();
		expect(unregisterLivechatEnterpriseSidebarItems).toHaveBeenCalledTimes(1);
	});
});
