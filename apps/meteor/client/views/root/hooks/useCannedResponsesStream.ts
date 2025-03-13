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

			const handleResponseObject = {
				changed: () => {
					const { type, ...fields } = response;
					CannedResponse.upsert({ _id: response._id }, fields);
				},
				removed: () => {
					CannedResponse.remove({ _id: response._id });
				},
				default: () => console.warn(`Unknown response type: ${response.type}`),
			};

			(handleResponseObject[response.type] || handleResponseObject.default)();
		});

		return () => {
			handleStopStreamingCannedResponses();
		};
	}, [uid, handleStreamCannedResponses, canAccess]);
};
