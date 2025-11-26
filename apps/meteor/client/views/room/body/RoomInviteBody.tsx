import { Box, Button, Chip, States, StatesActions, StatesIcon, StatesLink, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

import { links } from '../../../lib/links';

type RoomInviteBodyProps = {
	isLoading?: boolean;
	inviterUsername: string;
	onAccept: () => void;
	onReject: () => void;
};

const RoomInviteBody = ({ inviterUsername, isLoading, onAccept, onReject }: RoomInviteBodyProps) => {
	const { t } = useTranslation();

	return (
		<Box m='auto'>
			<States>
				<StatesIcon name='mail' />
				<StatesTitle>{t('Message_request')}</StatesTitle>
				<StatesSubtitle>
					<Box mbe={8}>{t('You_have_been_invited_to_have_a_conversation_with')}</Box>
					<Chip>
						<UserAvatar username={inviterUsername} size='x16' /> {inviterUsername}
					</Chip>
				</StatesSubtitle>
				<StatesActions>
					<Button secondary danger loading={isLoading} onClick={onReject}>
						{t('Reject')}
					</Button>
					<Button loading={isLoading} onClick={onAccept}>
						{t('Accept')}
					</Button>
				</StatesActions>
				<StatesLink href={links.go.matrixFederation}>{t('Learn_more_about_Federation')}</StatesLink>
			</States>
		</Box>
	);
};

export default RoomInviteBody;
