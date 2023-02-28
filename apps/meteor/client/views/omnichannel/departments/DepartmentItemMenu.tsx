import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useRoute, useSetModal, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import PermanentDepartmentRemovalModal from './PermanentDepartmentRemovalModal';

const DepartmentItemMenu = ({ dep }: { dep: Omit<ILivechatDepartment, '_updatedAt'> }): ReactElement => {
	const archiveDepartment = useEndpoint('POST', '/v1/livechat/department/:_id/archive', { _id: dep._id });

	const t = useTranslation();
	const departmentRemovalEnabled = useSetting('Omnichannel_enable_department_removal');
	const setModal = useSetModal();
	const route = useRoute('omnichannel-departments');
	const dispatchToast = useToastMessageDispatch();

	const handleEdit = useMutableCallback(() => {
		route.push({ context: 'edit', id: dep._id });
	});

	const queryClient = useQueryClient();

	const handlePageDepartmentsReload = useCallback(async () => {
		await queryClient.invalidateQueries(['omnichannel', 'departments']);
	}, [queryClient]);

	const handleArchiveDepartment = useMutableCallback(async () => {
		await archiveDepartment();
		handlePageDepartmentsReload();
		dispatchToast({ type: 'success', message: t('Department_archived') });
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
		edit: {
			label: (
				<>
					<Icon name='edit' size='x16' marginInlineEnd='x4' />
					{t('Edit')}
				</>
			),
			action: (): void => handleEdit(),
		},
		archive: {
			label: (
				<>
					<Icon name='arrow-down-box' size='x16' marginInlineEnd='x4' />
					{t('Archive')}
				</>
			),
			action: (): Promise<void> => handleArchiveDepartment(),
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

export default DepartmentItemMenu;
