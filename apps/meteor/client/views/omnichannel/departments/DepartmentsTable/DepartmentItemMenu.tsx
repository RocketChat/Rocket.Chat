import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useRoute, useSetModal, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import RemoveDepartmentModal from './RemoveDepartmentModal';

const ARCHIVE_DEPARTMENT_ENDPOINTS = {
	archive: '/v1/livechat/department/:_id/archive',
	unarchive: '/v1/livechat/department/:_id/unarchive',
} as const;

type DepartmentItemMenuProps = {
	department: Omit<ILivechatDepartment, '_updatedAt'>;
	archived: boolean;
};

const DepartmentItemMenu = ({ department, archived }: DepartmentItemMenuProps): ReactElement => {
	const t = useTranslation();
	const queryClient = useQueryClient();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const route = useRoute('omnichannel-departments');
	const departmentRemovalEnabled = useSetting('Omnichannel_enable_department_removal');
	const { _id, name } = department;

	const toggleArchive = useEndpoint('POST', archived ? ARCHIVE_DEPARTMENT_ENDPOINTS.unarchive : ARCHIVE_DEPARTMENT_ENDPOINTS.archive, {
		_id,
	});

	const handleEdit = useMutableCallback(() => {
		route.push({ context: 'edit', id: _id });
	});

	const handleReload = useCallback(async () => {
		await queryClient.invalidateQueries(['livechat-departments']);
	}, [queryClient]);

	const handleToggleArchive = useMutableCallback(async () => {
		try {
			await toggleArchive();
			dispatchToastMessage({ type: 'success', message: archived ? t('Department_unarchived') : t('Department_archived') });
			queryClient.removeQueries(['/v1/livechat/department/:_id', department._id]);
			handleReload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handlePermanentDepartmentRemoval = useMutableCallback(() => {
		setModal(<RemoveDepartmentModal _id={_id} reset={handleReload} onClose={() => setModal(null)} name={name} />);
	});

	const menuOptions = {
		...(!archived && {
			edit: {
				label: (
					<>
						<Icon name='edit' size='x16' mie={4} />
						{t('Edit')}
					</>
				),
				action: (): void => handleEdit(),
			},
		}),
		[archived ? 'unarchive' : 'archive']: {
			label: (
				<>
					<Icon name={archived ? 'undo' : 'arrow-down-box'} size='x16' mie={4} />
					{archived ? t('Unarchive') : t('Archive')}
				</>
			),
			action: (): Promise<void> => handleToggleArchive(),
		},
		delete: {
			label: (
				<Box data-tooltip={!departmentRemovalEnabled ? t('Department_Removal_Disabled') : undefined}>
					<Icon name='trash' size='x16' mie={4} />
					{t('Delete')}
				</Box>
			),
			action: (): void => handlePermanentDepartmentRemoval(),
			disabled: !departmentRemovalEnabled,
		},
	};
	return <Menu options={menuOptions} />;
};

export default DepartmentItemMenu;
