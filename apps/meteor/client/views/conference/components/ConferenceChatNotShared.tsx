import { Box, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

/**
 * Conference membership grants no room access, so being in a call doesn't mean being in its chat. That isn't
 * an error and it isn't this user's to fix — any participant who can read the chat is shown the same situation
 * from the other side, with the actions to resolve it. Say so, rather than reporting a missing page.
 */
const ConferenceChatNotShared = () => {
	const { t } = useTranslation();

	return (
		<Box display='flex' justifyContent='center' alignItems='center' flexGrow={1} paddingInline={24}>
			<States>
				<StatesIcon name='balloon-off' />
				<StatesTitle>{t('Chat_not_shared_with_you')}</StatesTitle>
				<StatesSubtitle>{t('Chat_not_shared_with_you_description')}</StatesSubtitle>
			</States>
		</Box>
	);
};

export default ConferenceChatNotShared;
