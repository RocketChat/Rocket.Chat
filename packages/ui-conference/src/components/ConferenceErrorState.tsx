import { Box, States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

/**
 * Something the call window asked for did not arrive, for a reason that says nothing about what was asked.
 *
 * Distinct from the screens that are an answer — the room is gone, the chat was never shared. A request that
 * failed is neither, and naming it as one of them sends the reader after the wrong problem. So this says only
 * what is known, and offers the one thing that helps.
 */
const ConferenceErrorState = ({ onRetry }: { onRetry: () => void }) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' justifyContent='center' alignItems='center' height='full' flexGrow={1}>
			<States>
				<StatesIcon name='circle-exclamation' variation='danger' />
				<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				<StatesActions>
					<StatesAction onClick={onRetry}>{t('Retry')}</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default ConferenceErrorState;
