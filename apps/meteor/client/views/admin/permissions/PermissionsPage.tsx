import { Margins, Tabs, Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePagination, Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRoute, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CustomRoleUpsellModal from './CustomRoleUpsellModal';
import PermissionsContextBar from './PermissionsContextBar';
import PermissionsTable from './PermissionsTable';
import { usePermissionsAndRoles } from './hooks/usePermissionsAndRoles';

const PermissionsPage = ({ isEnterprise }: { isEnterprise: boolean }): ReactElement => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const defaultType = canViewPermission ? 'permissions' : 'settings';
	const [type, setType] = useState(defaultType);
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();

	const paginationData = usePagination();
	const { permissions, total, roleList } = usePermissionsAndRoles(type, filter, paginationData.itemsPerPage, paginationData.current);

	const handlePermissionsTab = useEffectEvent(() => {
		if (type === 'permissions') {
			return;
		}
		setType('permissions');
	});

	const handleSettingsTab = useEffectEvent(() => {
		if (type === 'settings') {
			return;
		}
		setType('settings');
	});

	const handleAdd = useEffectEvent(() => {
		if (!isEnterprise) {
			setModal(<CustomRoleUpsellModal onClose={() => setModal(null)} />);
			return;
		}
		router.push({
			context: 'new',
		});
	});

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Permissions')}>
					<Button primary onClick={handleAdd} aria-label={t('New')} name={t('New_role')}>
						{t('New_role')}
					</Button>
				</PageHeader>
				<Margins blockEnd={16}>
					<Tabs>
						<Tabs.Item
							selected={type === 'permissions'}
							onClick={canViewPermission ? handlePermissionsTab : undefined}
							disabled={!canViewPermission}
						>
							{t('Permissions')}
						</Tabs.Item>
						<Tabs.Item selected={type === 'settings'} onClick={handleSettingsTab} disabled={!canViewSettingPermission}>
							{t('Settings')}
						</Tabs.Item>
					</Tabs>
				</Margins>
				<PageContent mb='neg-x8'>
					<Margins block={8}>
						<PermissionsTable
							roleList={roleList}
							permissions={permissions}
							total={total}
							setFilter={setFilter}
							paginationData={paginationData}
						/>
					</Margins>
				</PageContent>
			</Page>
			<PermissionsContextBar />
		</Page>
	);
};

export default PermissionsPage;
