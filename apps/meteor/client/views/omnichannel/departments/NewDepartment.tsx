import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import EditDepartment from './EditDepartment';
import EnterpriseDepartmentsModal from '../../../components/Omnichannel/modals/EnterpriseDepartmentsModal';
import PageSkeleton from '../../../components/PageSkeleton';

type NewDepartmentProps = {
	id?: string;
};

const NewDepartment = ({ id }: NewDepartmentProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const getDepartmentCreationAvailable = useEndpoint('GET', '/v1/livechat/department/isDepartmentCreationAvailable');
	const { data, isPending, isError } = useQuery({
		queryKey: ['getDepartments'],
		queryFn: () => getDepartmentCreationAvailable(),
	});

	useEffect(() => {
		if (data?.isDepartmentCreationAvailable === false) {
			setModal(<EnterpriseDepartmentsModal closeModal={(): void => setModal(null)} />);
		}
	}, [data?.isDepartmentCreationAvailable, setModal]);

	if (isError) {
		return <Callout type='danger'>{t('Unavailable')}</Callout>;
	}

	if (!data || isPending || !data.isDepartmentCreationAvailable) {
		return <PageSkeleton />;
	}

	return <EditDepartment id={id} title={t('New_Department')} />;
};

export default NewDepartment;
