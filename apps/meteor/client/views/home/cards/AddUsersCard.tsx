import type { Card } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import GenericCard from '../../../components/GenericCard';

const AddUsersCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const t = useTranslation();

	const router = useRouter();
	const handleOpenUsersRoute = (): void => {
		router.navigate('/admin/users');
	};

	return (
		<GenericCard
			title={t('Add_users')}
			body={t('Invite_and_add_members_to_this_workspace_to_start_communicating')}
			buttons={[{ onClick: handleOpenUsersRoute, label: t('Add_users'), primary: true }]}
			data-qa-id='homepage-add-users-card'
			{...props}
		/>
	);
};

export default AddUsersCard;
