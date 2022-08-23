import { Button } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

const JoinRoomsCard = (): ReactElement => {
	const t = useTranslation();

	const directoryRoute = useRoute('directory');
	const handleDirectory = (): void => {
		directoryRoute.push({});
	};

	return (
		<Card variant='light' data-qa-id='homepage-join-rooms-card'>
			<Card.Title>{t('Join_rooms')}</Card.Title>
			<Card.Body>{t('Discover_public_channels_and_teams_in_the_workspace_directory')}</Card.Body>
			<Card.FooterWrapper>
				<Card.Footer>
					<Button onClick={handleDirectory}>{t('Open_directory')}</Button>
				</Card.Footer>
			</Card.FooterWrapper>
		</Card>
	);
};

export default JoinRoomsCard;
