import { Button } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardTitle from '../../../components/Card/Title';

// Join Rooms card for homepage
// Should only be visible to those with permission to create new channels/groups
const JoinRoomsCard = (): ReactElement => {
	const t = useTranslation();

	const directoryRoute = useRoute('directory');
	const handleDirectory = (): void => {
		directoryRoute.push({});
	};

	return (
		<Card variant='light'>
			<CardTitle>{t('Homepage_card_join_rooms_title')}</CardTitle>

			<CardBody>{t('Homepage_card_join_rooms_description')}</CardBody>

			<CardFooterWrapper>
				<Button onClick={handleDirectory}>{t('Homepage_card_join_rooms_action_button')}</Button>
			</CardFooterWrapper>
		</Card>
	);
};

export default JoinRoomsCard;
