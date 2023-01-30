import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import PermanentDepartmentRemovalModal from './PermanentDepartmentRemovalModal';

const ArchivedItemMenu = ({
	dep,
	handlePageDepartmentsReload,
}: {
	dep: Omit<ILivechatDepartment, '_updatedAt'>;
	handlePageDepartmentsReload: () => void;
}): ReactElement => {
	const unarchiveDepartment = useEndpoint('POST', '/v1/livechat/department/:_id/unarchive', { _id: dep._id });

	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToast = useToastMessageDispatch();
	const departmentRemovalEnabled = useSetting('departmentRemovalEnabled');

	const handleUnarchiveDepartment = useMutableCallback(() => {
		unarchiveDepartment();
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
			action: (): void => handleUnarchiveDepartment(),
		},

		...(departmentRemovalEnabled === true && {
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
