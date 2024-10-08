import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useRoom } from '../contexts/RoomContext';

const MessageListErrorBoundary = ({ children }: { children: ReactNode }): ReactElement => {
	const t = useTranslation();
	const room = useRoom();

	return (
		<ErrorBoundary
			children={children}
			resetKeys={[room._id]}
			fallback={
				<States>
					<StatesIcon name='circle-exclamation' variation='danger' />
					<StatesTitle>{t('Error')}</StatesTitle>
					<StatesSubtitle>{t('Error_something_went_wrong')}</StatesSubtitle>
					<StatesActions>
						<StatesAction
							onClick={(): void => {
								location.reload();
							}}
						>
							<Icon name='reload' /> {t('Reload')}
						</StatesAction>
					</StatesActions>
				</States>
			}
		/>
	);
};

export default MessageListErrorBoundary;
