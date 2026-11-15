import { Margins, Button } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { usePagination, Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRoute, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CustomRoleUpsellModal from './CustomRoleUpsellModal';
import PermissionsContextBar from './PermissionsContextBar';
import PermissionsTable from './PermissionsTable';
import { usePermissionsAndRoles } from './hooks/usePermissionsAndRoles';
import { PageTabs } from '../../../components/PageTabs';

export type PermissionsPageProps = { isEnterprise: boolean };

const PermissionsPage = ({ isEnterprise }: PermissionsPageProps) => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const defaultType = canViewPermission ? 'permissions' : 'settings';
	// TODO: evaluate switching to the other tab when the selected tab's permission is revoked mid-session
	const [type, setType] = useState(defaultType);
	const router = useRoute('admin-permissions');
	const setModal = useSetModal();

	const paginationData = usePagination();
	const { permissions, total, roleList } = usePermissionsAndRoles(type, filter, paginationData.itemsPerPage, paginationData.current);

	const handleAdd = useStableCallback(() => {
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
					<Button variant='primary' onClick={handleAdd} aria-label={t('New')} name={t('New_role')}>
						{t('New_role')}
					</Button>
				</PageHeader>
				<PageTabs
					items={[
						{ id: 'permissions', label: t('Permissions'), disabled: !canViewPermission },
						{ id: 'settings', label: t('Settings'), disabled: !canViewSettingPermission },
					]}
					selected={type}
					onSelect={setType}
				/>
				<PageContent marginBlockStart={8} marginBlockEnd='neg-x8'>
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
