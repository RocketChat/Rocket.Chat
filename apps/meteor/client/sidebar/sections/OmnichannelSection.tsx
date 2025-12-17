import { Sidebar, SidebarDivider, SidebarSection } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRoute, usePermission } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { OverMacLimitSection } from './OverMacLimitSection';
import { OmnichannelLivechatToggle } from './actions';
import { useIsOverMacLimit } from '../../views/omnichannel/hooks/useIsOverMacLimit';
import { useOmnichannelShowQueueLink } from '../../views/omnichannel/hooks/useOmnichannelShowQueueLink';
import SidebarHeaderToolbar from '../header/SidebarHeaderToolbar';

const OmnichannelSection = () => {
	const { t } = useTranslation();
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
			<SidebarSection aria-label={t('Omnichannel_actions')}>
				<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
				<SidebarHeaderToolbar>
					{showOmnichannelQueueLink && (
						<Sidebar.TopBar.Action icon='queue' data-tooltip={t('Queue')} onClick={(): void => handleRoute('queue')} />
					)}
					<OmnichannelLivechatToggle />
					{hasPermissionToSeeContactCenter && (
						<Sidebar.TopBar.Action
							data-tooltip={t('Contact_Center')}
							aria-label={t('Contact_Center')}
							icon='address-book'
							onClick={(): void => handleRoute('directory')}
						/>
					)}
				</SidebarHeaderToolbar>
			</SidebarSection>
			<SidebarDivider />
		</>
	);
};

export default memo(OmnichannelSection);
