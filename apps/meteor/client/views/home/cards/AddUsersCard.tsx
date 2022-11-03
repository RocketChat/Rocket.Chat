import { Button } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const AddUsersCard = (): ReactElement => {
	const t = useTranslation();

	const adminUsersRoute = useRoute('admin-users');
	const handleOpenUsersRoute = (): void => {
		adminUsersRoute.push({});
	};

	return (
		<Card variant='light' data-qa-id='homepage-add-users-card'>
			<Card.Title>{t('Add_users')}</Card.Title>
			<Card.Body>{t('Invite_and_add_members_to_this_workspace_to_start_communicating')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<Button primary onClick={handleOpenUsersRoute}>
						{t('Add_users')}
					</Button>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default AddUsersCard;
