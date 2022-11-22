import { IMessage } from '@rocket.chat/core-typings';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { findParentMessage } from '../../../../../app/ui-message/client/messageThread';

export const useParentMessage = (mid: IMessage['_id']): UseQueryResult<IMessage> =>
	useQuery(['parent-message', { mid }], async () => findParentMessage(mid));
