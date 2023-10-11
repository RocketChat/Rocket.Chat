import { Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardFooter, CardFooterWrapper, CardTitle } from '@rocket.chat/ui-client';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const AddUsersCard = (): ReactElement => {
	const t = useTranslation();

	const adminUsersRoute = useRoute('admin-users');
	const handleOpenUsersRoute = (): void => {
		adminUsersRoute.push({});
	};

	return (
		<Card data-qa-id='homepage-add-users-card'>
			<CardTitle>{t('Add_users')}</CardTitle>
			<CardBody>{t('Invite_and_add_members_to_this_workspace_to_start_communicating')}</CardBody>
			<CardFooterWrapper>
				<CardFooter>
					<Button primary onClick={handleOpenUsersRoute}>
						{t('Add_users')}
					</Button>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default AddUsersCard;
