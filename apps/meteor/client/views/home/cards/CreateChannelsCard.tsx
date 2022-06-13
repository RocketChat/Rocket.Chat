import { Button } from '@rocket.chat/fuselage';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardTitle from '../../../components/Card/Title';
import CreateChannelWithData from '../../../sidebar/header/CreateChannelWithData';

// Create Channels card for homepage
// Should only be visible to those with permission to create new channels/groups
const CreateChannelsCard = (): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();

	const openCreateChannelModal = (): void => setModal(<CreateChannelWithData onClose={(): void => setModal(null)} />);

	return (
		<Card variant='light'>
			<CardTitle>{t('Create_channels')}</CardTitle>

			<CardBody>{t('Homepage_card_create_channels_description')}</CardBody>

			<CardFooterWrapper>
				<Button onClick={openCreateChannelModal}>{t('Create_channel')}</Button>
			</CardFooterWrapper>
		</Card>
	);
};

export default CreateChannelsCard;
