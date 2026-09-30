import type { OmichannelRoutingConfig } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import OmnichannelProvider from './OmnichannelProvider';
import { useOmnichannelRouteConfig } from '../views/omnichannel/hooks/useOmnichannelRouteConfig';

jest.mock('../hooks/useHasLicenseModule', () => ({ useHasLicenseModule: () => ({ data: false }) }));
jest.mock('../hooks/useShouldPreventAction', () => ({ useShouldPreventAction: () => false }));
jest.mock('../hooks/useOmnichannelContinuousSoundNotification', () => ({ useOmnichannelContinuousSoundNotification: () => undefined }));

const config = { showQueue: true, autoAssignAgent: false } as OmichannelRoutingConfig;

const renderRouteConfig = (canAccess: boolean) => {
	const getRoutingConfig = jest.fn(() => ({ config }));
	const root = mockAppRoot()
		.withJohnDoe()
		.withSetting('Livechat_enabled', true)
		.withEndpoint('GET', '/v1/livechat/config/routing', getRoutingConfig);
	const AppRoot = (canAccess ? root.withPermission('view-l-room') : root).build();

	const { result } = renderHook(() => useOmnichannelRouteConfig(), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<AppRoot>
				<OmnichannelProvider>{children}</OmnichannelProvider>
			</AppRoot>
		),
	});

	return { result, getRoutingConfig };
};

it('should expose the routing config to agents with access', async () => {
	const { result } = renderRouteConfig(true);

	await waitFor(() => expect(result.current).toEqual(config));
});

it('should not request the routing config without access', () => {
	const { result, getRoutingConfig } = renderRouteConfig(false);

	expect(getRoutingConfig).not.toHaveBeenCalled();
	expect(result.current).toBeUndefined();
});
