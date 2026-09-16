import { Box, States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import RoomLayout from '../../room/layout/RoomLayout';

/**
 * The chat panel could not be opened, for a reason that says nothing about the room.
 *
 * Distinct from `RoomNotFound`, which is an answer — the room is gone, or was never this participant's to read.
 * A server that did not answer at all is not that, and telling somebody their room does not exist because a
 * request failed sends them looking for the wrong problem. So this says only what is known, and offers the one
 * thing that helps.
 */
const ConferenceRoomError = ({ onRetry }: { onRetry: () => void }) => {
	const { t } = useTranslation();

	return (
		<RoomLayout
			body={
				<Box display='flex' justifyContent='center' height='full'>
					<States>
						<StatesIcon name='circle-exclamation' variation='danger' />
						<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
						<StatesActions>
							<StatesAction onClick={onRetry}>{t('Retry')}</StatesAction>
						</StatesActions>
					</States>
				</Box>
			}
		/>
	);
};

export default ConferenceRoomError;
