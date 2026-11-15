import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useABACTabPermissions } from './hooks/useABACTabPermissions';
import { useIsExternalAttributeStore } from './hooks/useIsExternalAttributeStore';
import { PageTabs } from '../../../components/PageTabs';

const AdminABACTabs = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const tab = useRouteParameter('tab');
	const tabPermissions = useABACTabPermissions();
	const isExternalStore = useIsExternalAttributeStore();

	return (
		<PageTabs
			items={[
				{ id: 'settings', label: t('Settings'), hidden: !tabPermissions.settings },
				{ id: 'room-attributes', label: t('ABAC_Room_Attributes'), hidden: !tabPermissions['room-attributes'] || isExternalStore },
				{ id: 'rooms', label: t('Rooms'), hidden: !tabPermissions.rooms },
				{ id: 'logs', label: t('ABAC_Logs'), hidden: !tabPermissions.logs },
			]}
			selected={tab}
			onSelect={(tab) => router.navigate({ name: 'admin-ABAC', params: { tab } })}
		/>
	);
};

export default AdminABACTabs;
