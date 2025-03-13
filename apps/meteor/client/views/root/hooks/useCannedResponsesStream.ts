import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useCanAccessCannedResponses } from './useCanAccessCannedResponses';
import { CannedResponse } from '../../../../app/canned-responses/client/collections/CannedResponse';

export const useCannedResponsesStream = () => {
	const uid = useUserId();
	const handleStreamCannedResponses = useStream('canned-responses');
	const canAccess = useCanAccessCannedResponses();

	useEffect(() => {
		if (!canAccess) {
			return;
		}

		const handleStopStreamingCannedResponses = handleStreamCannedResponses('canned-responses', (...[response, options]) => {
			const { agentsId } = options || {};
			if (Array.isArray(agentsId) && !agentsId.includes(uid)) {
				return;
			}

			switch (response.type) {
				case 'changed': {
					const { type, ...fields } = response;
					CannedResponse.upsert({ _id: response._id }, fields);
					break;
				}
				case 'removed': {
					CannedResponse.remove({ _id: response._id });
					break;
				}
			}
		});

		return () => {
			handleStopStreamingCannedResponses();
		};
	}, [uid, handleStreamCannedResponses, canAccess]);
};
