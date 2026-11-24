import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { PageTabs } from '../../../components/PageTabs';
import type { ISettings } from '../definitions/ISettings';

export type AppDetailsPageTabsProps = {
	context: string;
	installed: boolean | undefined;
	isSecurityVisible: boolean;
	settings: ISettings | undefined;
	tab: string | undefined;
	hasCluster: boolean;
};

const AppDetailsPageTabs = ({
	context,
	installed = false,
	isSecurityVisible,
	settings,
	tab,
	hasCluster = false,
}: AppDetailsPageTabsProps) => {
	const { t } = useTranslation();
	const isAdminUser = usePermission('manage-apps');

	const router = useRouter();

	return (
		<PageTabs<string>
			items={[
				{ id: 'details', label: t('Details') },
				{ id: 'requests', label: t('Requests'), hidden: !isAdminUser || context === 'private' },
				{ id: 'security', label: t('Security'), hidden: !isSecurityVisible },
				{ id: 'releases', label: t('Releases'), hidden: context === 'private' },
				{
					id: 'settings',
					label: t('Settings'),
					hidden: !(installed && Boolean(settings && Object.values(settings).length) && isAdminUser),
				},
				{ id: 'logs', label: t('Logs'), hidden: !(installed && isAdminUser) },
				{ id: 'instances', label: t('Instances'), hidden: !(hasCluster && installed && isAdminUser) },
			]}
			selected={tab || 'details'}
			onSelect={(tab) => router.navigate({ name: 'marketplace', params: { ...router.getRouteParameters(), tab } }, { replace: true })}
		/>
	);
};

export default AppDetailsPageTabs;
