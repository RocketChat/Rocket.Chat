import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import PermanentDepartmentRemovalModal from './PermanentDepartmentRemovalModal';

const ArchivedItemMenu = ({ dep }: { dep: Omit<ILivechatDepartment, '_updatedAt'> }): ReactElement => {
	const unarchiveDepartment = useEndpoint('POST', '/v1/livechat/department/:_id/unarchive', { _id: dep._id });

	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToast = useToastMessageDispatch();
	const departmentRemovalEnabled = useSetting('Omnichannel_enable_department_removal') === true;

	const queryClient = useQueryClient();

	const handlePageDepartmentsReload = useCallback(async () => {
		await queryClient.invalidateQueries(['omnichannel', 'departments', 'archived']);
	}, [queryClient]);

	const handleUnarchiveDepartment = useMutableCallback(async () => {
		await unarchiveDepartment();
		handlePageDepartmentsReload();
		dispatchToast({ type: 'success', message: t('Department_unarchived') });
	});

	const handlePermanentDepartmentRemoval = useMutableCallback(() => {
		setModal(
			<PermanentDepartmentRemovalModal
				_id={dep._id}
				reset={handlePageDepartmentsReload}
				onClose={() => setModal(undefined)}
				name={dep.name}
			/>,
		);
	});

	const menuOptions = {
		unarchive: {
			label: (
				<>
					<Icon name='undo' size='x16' marginInlineEnd='x4' />
					{t('Unarchive')}
				</>
			),
			action: (): Promise<void> => handleUnarchiveDepartment(),
		},

		delete: {
			label: (
				<Box data-tooltip={!departmentRemovalEnabled ? t('Department_Removal_Disabled') : undefined}>
					<Icon name='trash' size='x16' marginInlineEnd='x4' />
					{t('Delete')}
				</Box>
			),
			action: (): void => handlePermanentDepartmentRemoval(),
			disabled: !departmentRemovalEnabled,
		},
	};
	return <Menu options={menuOptions} />;
};

export default ArchivedItemMenu;
