import { useCallback } from 'react';

import { useEndpoint } from '../../../../../contexts/ServerContext';

type UnstarMessageParamType = {
	messageId: string;
};

type UnstarMessageType = (param: UnstarMessageParamType) => void;

export const useUnstarMessage = (): (mid: string) => Promise<void> => {
	const unstarMessage: UnstarMessageType = useEndpoint('POST', 'chat.unStarMessage');

	return useCallback<(mid: string) => Promise<void>>(async (mid) => {
		unstarMessage({ messageId: mid });
	}, [unstarMessage]);
};
