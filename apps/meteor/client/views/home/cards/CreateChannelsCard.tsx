import { Button } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import CreateChannelWithData from '../../../sidebar/header/CreateChannel';

const CreateChannelsCard = (): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();

	const openCreateChannelModal = (): void => setModal(<CreateChannelWithData onClose={(): void => setModal(null)} />);

	return (
		<Card variant='light' data-qa-id='homepage-create-channels-card'>
			<Card.Title>{t('Create_channels')}</Card.Title>
			<Card.Body>{t('Create_a_public_channel_that_new_workspace_members_can_join')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<Button onClick={openCreateChannelModal}>{t('Create_channel')}</Button>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default CreateChannelsCard;
