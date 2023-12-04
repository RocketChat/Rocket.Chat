import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericCard from '../../../components/GenericCard';

const AddUsersCard = (): ReactElement => {
	const t = useTranslation();

	const router = useRouter();
	const handleOpenUsersRoute = (): void => {
		router.navigate('/admin/users');
	};

	return (
		<GenericCard
			title={t('Add_users')}
			body={t('Invite_and_add_members_to_this_workspace_to_start_communicating')}
			controls={[{ onClick: handleOpenUsersRoute, label: t('Add_users'), primary: true }]}
			data-qa-id='homepage-add-users-card'
		/>
	);
};

export default AddUsersCard;
