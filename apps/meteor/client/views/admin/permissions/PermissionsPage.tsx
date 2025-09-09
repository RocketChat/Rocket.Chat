import { Margins, Tabs, Button } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CustomRoleUpsellModal from './CustomRoleUpsellModal';
import PermissionsContextBar from './PermissionsContextBar';
import PermissionsTable from './PermissionsTable';
import { usePermissionsAndRoles } from './hooks/usePermissionsAndRoles';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const PermissionsPage = ({ isEnterprise }: { isEnterprise: boolean }): ReactElement => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const defaultType = canViewPermission ? 'permissions' : 'settings';
	const [type, setType] = useState(defaultType);
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();

	const paginationProps = usePagination();
	const { permissions, total, roleList } = usePermissionsAndRoles(type, filter, paginationProps.itemsPerPage, paginationProps.current);

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
							data-qa='PermissionTable-Permissions'
							selected={type === 'permissions'}
							onClick={handlePermissionsTab}
							disabled={!canViewPermission}
						>
							{t('Permissions')}
						</Tabs.Item>
						<Tabs.Item
							data-qa='PermissionTable-Settings'
							selected={type === 'settings'}
							onClick={handleSettingsTab}
							disabled={!canViewSettingPermission}
						>
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
							paginationProps={paginationProps}
						/>
					</Margins>
				</PageContent>
			</Page>
			<PermissionsContextBar />
		</Page>
	);
};

export default PermissionsPage;
