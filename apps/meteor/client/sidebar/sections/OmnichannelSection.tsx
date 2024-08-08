import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRoute, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { useIsCallEnabled, useIsCallReady } from '../../contexts/OmnichannelCallContext';
import { useIsOverMacLimit } from '../../hooks/omnichannel/useIsOverMacLimit';
import { useOmnichannelShowQueueLink } from '../../hooks/omnichannel/useOmnichannelShowQueueLink';
import SidebarHeaderToolbar from '../header/SidebarHeaderToolbar';
import { OverMacLimitSection } from './OverMacLimitSection';
import { OmniChannelCallDialPad, OmnichannelCallToggle, OmnichannelLivechatToggle } from './actions';

const OmnichannelSection = () => {
	const t = useTranslation();
	const isCallEnabled = useIsCallEnabled();
	const isCallReady = useIsCallReady();
	const hasPermissionToSeeContactCenter = usePermission('view-omnichannel-contact-center');
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const { sidebar } = useLayout();
	const directoryRoute = useRoute('omnichannel-directory');
	const queueListRoute = useRoute('livechat-queue');
	const isWorkspaceOverMacLimit = useIsOverMacLimit();

	const handleRoute = useMutableCallback((route) => {
		sidebar.toggle();

		switch (route) {
			case 'directory':
				directoryRoute.push({});
				break;
			case 'queue':
				queueListRoute.push({});
				break;
		}
	});

	// The className is a paliative while we make TopBar.ToolBox optional on fuselage
	return (
		<>
			{isWorkspaceOverMacLimit && <OverMacLimitSection />}

			<Sidebar.TopBar.Section aria-label={t('Omnichannel_actions')} className='omnichannel-sidebar'>
				<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
				<SidebarHeaderToolbar>
					{showOmnichannelQueueLink && (
						<Sidebar.TopBar.Action icon='queue' data-tooltip={t('Queue')} onClick={(): void => handleRoute('queue')} />
					)}
					{isCallEnabled && <OmnichannelCallToggle />}
					<OmnichannelLivechatToggle />
					{hasPermissionToSeeContactCenter && (
						<Sidebar.TopBar.Action
							data-tooltip={t('Contact_Center')}
							aria-label={t('Contact_Center')}
							icon='address-book'
							onClick={(): void => handleRoute('directory')}
						/>
					)}
					{isCallReady && <OmniChannelCallDialPad />}
				</SidebarHeaderToolbar>
			</Sidebar.TopBar.Section>
		</>
	);
};

export default memo(OmnichannelSection);
