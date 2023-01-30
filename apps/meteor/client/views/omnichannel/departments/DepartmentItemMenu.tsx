import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useRoute, useSetModal, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import PermanentDepartmentRemovalModal from './PermanentDepartmentRemovalModal';

const DepartmentItemMenu = ({ dep, reload }: { dep: Omit<ILivechatDepartment, '_updatedAt'>; reload: () => void }): ReactElement => {
	const archiveDepartment = useEndpoint('POST', '/v1/livechat/department/:_id/archive', { _id: dep._id });

	const t = useTranslation();
	const departmentRemovalEnabled = useSetting('departmentRemovalEnabled');
	const setModal = useSetModal();
	const route = useRoute('omnichannel-departments');
	const dispatchToast = useToastMessageDispatch();

	const handleEdit = useMutableCallback(() => {
		route.push({ context: 'edit', id: dep._id });
	});

	const handleArchiveDepartment = useMutableCallback(() => {
		archiveDepartment();
		reload();
		dispatchToast({ type: 'success', message: t('Department_archived') });
	});

	const handlePermanentDepartmentRemoval = useMutableCallback(() => {
		setModal(<PermanentDepartmentRemovalModal _id={dep._id} reset={reload} onClose={() => setModal(undefined)} name={dep.name} />);
	});

	const menuOptions = {
		edit: {
			label: { label: t('Edit'), icon: 'edit' },
			action: (): void => handleEdit(),
		},
		archive: {
			label: { label: t('Archive'), icon: 'arrow-down-box' },
			action: (): void => handleArchiveDepartment(),
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

export default DepartmentItemMenu;
