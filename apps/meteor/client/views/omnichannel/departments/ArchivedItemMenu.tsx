import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Menu, Option } from '@rocket.chat/fuselage';
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
			label: { label: t('Unarchive'), icon: 'undo' },
			action: (): Promise<void> => handleUnarchiveDepartment(),
		},

		...(departmentRemovalEnabled && {
			delete: {
				label: { label: t('Delete'), icon: 'trash' },
				action: (): void => handlePermanentDepartmentRemoval(),
			},
		}),
	};
	return (
		<Menu
			options={menuOptions}
			renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option label={label} icon={icon} {...props} />}
		/>
	);
};

export default ArchivedItemMenu;
