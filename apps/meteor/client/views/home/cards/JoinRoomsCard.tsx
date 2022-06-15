import { Button } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardTitle from '../../../components/Card/Title';

const JoinRoomsCard = (): ReactElement => {
	const t = useTranslation();

	const directoryRoute = useRoute('directory');
	const handleDirectory = (): void => {
		directoryRoute.push({});
	};

	return (
		<Card variant='light' data-qa-id='homepage-join-rooms-card'>
			<CardTitle>{t('Join_rooms')}</CardTitle>

			<CardBody>{t('Discover_public_channels_and_teams_in_the_workspace_directory')}</CardBody>

			<CardFooterWrapper>
				<Button onClick={handleDirectory}>{t('Open_directory')}</Button>
			</CardFooterWrapper>
		</Card>
	);
};

export default JoinRoomsCard;
