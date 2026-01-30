import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint, useRoute, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RemoveDepartmentModal from './RemoveDepartmentModal';

const ARCHIVE_DEPARTMENT_ENDPOINTS = {
	archive: '/v1/livechat/department/:_id/archive',
	unarchive: '/v1/livechat/department/:_id/unarchive',
} as const;

type DepartmentItemMenuProps = {
	department: Omit<ILivechatDepartment, '_updatedAt'>;
	archived: boolean;
};

// TODO: Use MenuV2 instead of Menu
const DepartmentItemMenu = ({ department, archived }: DepartmentItemMenuProps): ReactElement => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const route = useRoute('omnichannel-departments');
	const departmentRemovalEnabled = useSetting('Omnichannel_enable_department_removal');
	const { _id, name } = department;

	const toggleArchive = useEndpoint('POST', archived ? ARCHIVE_DEPARTMENT_ENDPOINTS.unarchive : ARCHIVE_DEPARTMENT_ENDPOINTS.archive, {
		_id,
	});

	const handleEdit = useEffectEvent(() => {
		route.push({ context: 'edit', id: _id });
	});

	const handleReload = useCallback(async () => {
		await queryClient.invalidateQueries({
			queryKey: ['livechat-departments'],
		});
	}, [queryClient]);

	const handleToggleArchive = useEffectEvent(async () => {
		try {
			await toggleArchive();
			dispatchToastMessage({ type: 'success', message: archived ? t('Department_unarchived') : t('Department_archived') });
			queryClient.removeQueries({
				queryKey: ['/v1/livechat/department/:_id', department._id],
			});
			handleReload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handlePermanentDepartmentRemoval = useEffectEvent(() => {
		setModal(<RemoveDepartmentModal _id={_id} reset={handleReload} onClose={() => setModal(null)} name={name} />);
	});

	const items = useMemo(
		() => [
			...(archived
				? []
				: [
						{
							id: 'edit',
							icon: 'edit' as const,
							content: t('Edit'),
							onClick: handleEdit,
						},
					]),
			{
				id: archived ? 'unarchive' : 'archive',
				icon: archived ? ('undo' as const) : ('arrow-down-box' as const),
				content: archived ? t('Unarchive') : t('Archive'),
				onClick: handleToggleArchive,
			},
			{
				id: 'delete',
				icon: 'trash' as const,
				content: t('Delete'),
				onClick: handlePermanentDepartmentRemoval,
				disabled: !departmentRemovalEnabled,
				tooltip: !departmentRemovalEnabled ? t('Department_Removal_Disabled') : undefined,
			},
		],
		[archived, departmentRemovalEnabled, handleEdit, handleToggleArchive, handlePermanentDepartmentRemoval, t],
	);

	return <GenericMenu title={t('Options')} items={items} />;
};

export default DepartmentItemMenu;
