import { Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardFooter, CardFooterWrapper, CardTitle } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const JoinRoomsCard = (): ReactElement => {
	const t = useTranslation();

	const router = useRouter();
	const handleDirectory = (): void => {
		router.navigate('/directory');
	};

	return (
		<Card data-qa-id='homepage-join-rooms-card'>
			<CardTitle>{t('Join_rooms')}</CardTitle>
			<CardBody>{t('Discover_public_channels_and_teams_in_the_workspace_directory')}</CardBody>
			<CardFooterWrapper>
				<CardFooter>
					<Button onClick={handleDirectory}>{t('Open_directory')}</Button>
				</CardFooter>
			</CardFooterWrapper>
		</Card>
	);
};

export default JoinRoomsCard;
