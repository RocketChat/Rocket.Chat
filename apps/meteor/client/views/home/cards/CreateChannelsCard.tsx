import { Button } from '@rocket.chat/fuselage';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardTitle from '../../../components/Card/Title';
import CreateChannelWithData from '../../../sidebar/header/CreateChannelWithData';

const CreateChannelsCard = (): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();

	const openCreateChannelModal = (): void => setModal(<CreateChannelWithData onClose={(): void => setModal(null)} />);

	return (
		<Card variant='light' data-qa-id='homepage-create-channels-card'>
			<CardTitle>{t('Create_channels')}</CardTitle>

			<CardBody>{t('Create_a_public_channel_that_new_workspace_members_can_join')}</CardBody>

			<CardFooterWrapper>
				<Button onClick={openCreateChannelModal}>{t('Create_channel')}</Button>
			</CardFooterWrapper>
		</Card>
	);
};

export default CreateChannelsCard;
