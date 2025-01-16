import type { IRoom } from '@rocket.chat/core-typings';
import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useJoinRoom } from '../hooks/useJoinRoom';

type NotSubscribedStateProps = {
	title: string;
	subtitle: string;
	rid: IRoom['_id'];
	roomType: IRoom['t'];
};

const NotSubscribedState = ({ title, subtitle, rid, roomType }: NotSubscribedStateProps): ReactElement => {
	const { t } = useTranslation();

	const handleJoinClick = useJoinRoom();

	// TODO: Handle onJoinClick error

	return (
		<Box display='flex' justifyContent='center' height='full'>
			<States>
				<StatesIcon name='hash' />
				<StatesTitle>{title}</StatesTitle>
				<StatesSubtitle>{subtitle}</StatesSubtitle>
				<Box mbs={16}>
					<StatesActions>
						<StatesAction disabled={handleJoinClick.isLoading} onClick={() => handleJoinClick.mutate({ rid, type: roomType })}>
							{t('Join_Chat')}
						</StatesAction>
					</StatesActions>
				</Box>
			</States>
		</Box>
	);
};

export default NotSubscribedState;
