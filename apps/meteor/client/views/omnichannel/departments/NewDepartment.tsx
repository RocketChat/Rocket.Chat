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
	const t = useTranslation();
	const setModal = useSetModal();
	const getDepartmentCreationAvailable = useEndpoint('GET', '/v1/livechat/department/isDepartmentCreationAvailable');
	const { data, isLoading, isError } = useQuery(['getDepartments'], () => getDepartmentCreationAvailable(), {
		onSuccess: (data) => {
			if (data.isDepartmentCreationAvailable === false) {
				setModal(<EnterpriseDepartmentsModal closeModal={(): void => setModal(null)} />);
			}
		},
	});

	if (isError) {
		return <Callout type='danger'>{t('Unavailable')}</Callout>;
	}

	if (!data || isLoading || !data.isDepartmentCreationAvailable) {
		return <PageSkeleton />;
	}

	return <EditDepartment id={id} title={t('New_Department')} />;
};

export default NewDepartment;
