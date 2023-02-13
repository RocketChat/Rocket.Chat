import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import EnterpriseDepartmentsModal from '../../../components/Omnichannel/modals/EnterpriseDepartmentsModal';
import PageSkeleton from '../../../components/PageSkeleton';
import EditDepartment from './EditDepartment';

type NewDepartmentProps = {
	id?: string;
};

const NewDepartment = ({ id }: NewDepartmentProps) => {
	const setModal = useSetModal();
	const getDepartmentCreationAvailable = useEndpoint('GET', '/v1/livechat/department/isDepartmentCreationAvailable');
	const { data, isLoading, error } = useQuery(['getDepartments'], () => getDepartmentCreationAvailable(), {
		onSuccess: (data) => {
			if (data.isDepartmentCreationAvailable === false) {
				setModal(<EnterpriseDepartmentsModal closeModal={(): void => setModal(null)} />);
			}
		},
	});

	const t = useTranslation();

	if (error) {
		return <Callout type='danger'>{t('Unavailable')}</Callout>;
	}

	if (!data || isLoading || !data.isDepartmentCreationAvailable) {
		return <PageSkeleton />;
	}

	// TODO: remove allowedToForwardData and data props once the EditDepartment component is migrated to TS
	return <EditDepartment id={id} title={t('New_Department')} allowedToForwardData={undefined} data={undefined} />;
};

export default NewDepartment;
