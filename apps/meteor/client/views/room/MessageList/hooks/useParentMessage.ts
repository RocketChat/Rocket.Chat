import type { IMessage } from '@rocket.chat/core-typings';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { findParentMessage } from '../../../../../app/ui-message/client/findParentMessage';

export const useParentMessage = (mid: IMessage['_id']): UseQueryResult<IMessage> =>
	useQuery({
		queryKey: ['parent-message', { mid }],
		queryFn: async () => findParentMessage(mid),
	});
