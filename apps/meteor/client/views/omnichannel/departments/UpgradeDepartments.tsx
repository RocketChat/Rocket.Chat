import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import EnterpriseDepartmentsModal from '../../../components/Omnichannel/modals/EnterpriseDepartmentsModal';
import PageSkeleton from '../../../components/PageSkeleton';

const UpgradeDepartments = () => {
	const setModal = useSetModal();

	useEffect(() => setModal(<EnterpriseDepartmentsModal closeModal={(): void => setModal(null)} />), [setModal]);
	return <PageSkeleton />;
};

export default UpgradeDepartments;
