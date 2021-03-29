import React, { FC, memo } from 'react';

import { usePermission } from '../contexts/AuthorizationContext';
import { useSetting } from '../contexts/SettingsContext';
import OmnichannelDisabledProvider from './OmnichannelDisabledProvider';
import OmnichannelEnabledProvider from './OmnichannelEnabledProvider';

const OmniChannelProvider: FC = ({ children }) => {
	const omniChannelEnabled = useSetting('Livechat_enabled') as boolean;
	const hasAccess = usePermission('view-l-room') as boolean;

	if (!omniChannelEnabled || !hasAccess) {
		return <OmnichannelDisabledProvider children={children} />;
	}
	return <OmnichannelEnabledProvider children={children} />;
};

export default memo(OmniChannelProvider);
