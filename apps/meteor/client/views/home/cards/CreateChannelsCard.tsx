import { Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardFooter, CardFooterWrapper, CardTitle } from '@rocket.chat/ui-client';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import CreateChannelWithData from '../../../sidebar/header/CreateChannel';

const CreateChannelsCard = (): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();

	const openCreateChannelModal = (): void => setModal(<CreateChannelWithData onClose={(): void => setModal(null)} />);

	return (
		<Card data-qa-id='homepage-create-channels-card'>
			<CardTitle>{t('Create_channels')}</CardTitle>
			<CardBody>{t('Create_a_public_channel_that_new_workspace_members_can_join')}</CardBody>
			<CardFooterWrapper>
				<CardFooter>
					<Button onClick={openCreateChannelModal}>{t('Create_channel')}</Button>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default CreateChannelsCard;
