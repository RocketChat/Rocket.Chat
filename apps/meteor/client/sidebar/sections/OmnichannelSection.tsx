import { Sidebar, SidebarDivider, SidebarSection } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayout, useRoute, usePermission } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { OverMacLimitSection } from './OverMacLimitSection';
import { OmniChannelCallDialPad, OmnichannelCallToggle, OmnichannelLivechatToggle } from './actions';
import { useIsCallEnabled, useIsCallReady } from '../../contexts/CallContext';
import { useIsOverMacLimit } from '../../hooks/omnichannel/useIsOverMacLimit';
import { useOmnichannelShowQueueLink } from '../../hooks/omnichannel/useOmnichannelShowQueueLink';
import SidebarHeaderToolbar from '../header/SidebarHeaderToolbar';

const OmnichannelSection = () => {
	const { t } = useTranslation();
	const isCallEnabled = useIsCallEnabled();
	const isCallReady = useIsCallReady();
	const hasPermissionToSeeContactCenter = usePermission('view-omnichannel-contact-center');
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const { sidebar } = useLayout();
	const directoryRoute = useRoute('omnichannel-directory');
	const queueListRoute = useRoute('livechat-queue');
	const isWorkspaceOverMacLimit = useIsOverMacLimit();

	const handleRoute = useEffectEvent((route: string) => {
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

			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
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
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<SidebarSection aria-label={t('Omnichannel_actions')}>
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
					</SidebarSection>
					<SidebarDivider />
				</FeaturePreviewOn>
			</FeaturePreview>
		</>
	);
};

export default memo(OmnichannelSection);
