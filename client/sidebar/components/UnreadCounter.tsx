import React, { FC, MutableRefObject } from 'react';
import { Box, Button } from '@rocket.chat/fuselage';

import { ISubscription } from '../../../definition/ISubscription';
import { TranslationContextValue } from '../../contexts/TranslationContext';

const UnreadCounter: FC<{
	roomsList: ISubscription[] | undefined;
	t: TranslationContextValue['translate'];
	virtuosoRef: MutableRefObject<any>;
}> = ({ roomsList, t, virtuosoRef }) => {
	if (!roomsList || !Array.isArray(roomsList)) {
		return null;
	}

	const hasUnread: boolean = roomsList.some(
		(room) => (room.alert || room.unread) && !room.hideUnreadStatus,
	);

	if (!hasUnread) {
		return null;
	}

	return (
		<Box textAlign='center' fontStyle='italic'>
			<Button
				info
				nude
				onClick={(): void =>
          virtuosoRef.current?.scrollToIndex({ index: 0, behavior: 'smooth' })
				}
			>
				{t('New_messages')}
			</Button>
		</Box>
	);
};

export default UnreadCounter;
