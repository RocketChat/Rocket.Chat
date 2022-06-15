import { IMessage } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { findParentMessage } from '../../../../../app/ui-message/client/messageThread';
import { AsyncState, useAsyncState } from '../../../../hooks/useAsyncState';

export const useParentMessage = (mid: IMessage['_id']): AsyncState<IMessage> => {
	const { resolve, reject, error, phase, value } = useAsyncState<IMessage>();

	useEffect(() => {
		findParentMessage(mid).then(resolve).catch(reject);
	}, [mid, reject, resolve]);

	return { phase, value, error } as AsyncState<IMessage>;
};
