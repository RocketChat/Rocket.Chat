import type { OmichannelRoutingConfig } from '@rocket.chat/core-typings';
import { useOmnichannel } from '@rocket.chat/ui-contexts';

export const useOmnichannelRouteConfig = (): OmichannelRoutingConfig | undefined => useOmnichannel().routeConfig;
