import type { IInviteSubscription } from '@rocket.chat/core-typings';
import { Box, Button, Chip, States, StatesActions, StatesIcon, StatesLink, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

type RoomInviteBodyProps = {
	isLoading?: boolean;
	inviter: IInviteSubscription['inviter'];
	infoLink?: {
		label: string;
		href: string;
	};
	onAccept: () => void;
	onReject: () => void;
};

const RoomInviteBody = ({ inviter, infoLink, isLoading, onAccept, onReject }: RoomInviteBodyProps) => {
	const { t } = useTranslation();
	const { name, username } = inviter;

	return (
		<Box m='auto'>
			<States>
				<StatesIcon name='mail' />
				<StatesTitle>{t('Message_request')}</StatesTitle>
				<StatesSubtitle>
					<Box mbe={8}>{t('You_have_been_invited_to_have_a_conversation_with')}</Box>
					<Chip>
						<UserAvatar username={username} size='x16' /> {name || username}
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
				{infoLink && <StatesLink href={infoLink.href}>{infoLink.label}</StatesLink>}
			</States>
		</Box>
	);
};

export default RoomInviteBody;
