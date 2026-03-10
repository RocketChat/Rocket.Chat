import { useRouteParameter, useRoomToolbox, useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useRoom } from '../contexts/RoomContext';

type DocumentationHandoffPayload = {
	interventionId?: string;
	returnTab?: string;
	returnContext?: string;
};

const getStorageKey = (roomId: string) => `medsense-documentation-return:${roomId}`;

export const useMedsenseDocumentationHandoff = (): void => {
	const room = useRoom();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');
	const { openTab } = useRoomToolbox();
	const subscribeToNotifyRoom = useStream('notify-room');

	useEffect(() => {
		if (!room?._id) {
			return;
		}

		return subscribeToNotifyRoom(`${room._id}/medsense-documentation-handoff`, (payload: DocumentationHandoffPayload) => {
			if (!payload?.interventionId) {
				return;
			}

			const returnContext = payload.returnContext || (tab === 'app' && context ? context : '');
			if (typeof window !== 'undefined' && returnContext) {
				window.sessionStorage.setItem(
					getStorageKey(room._id),
					JSON.stringify({
						returnTab: payload.returnTab || 'app',
						returnContext,
					}),
				);
			}

			openTab('medsense-documentation', payload.interventionId);
		});
	}, [context, openTab, room?._id, subscribeToNotifyRoom, tab]);
};

export const popMedsenseDocumentationReturnTarget = (roomId: string): { returnTab?: string; returnContext?: string } => {
	if (typeof window === 'undefined') {
		return {};
	}

	const key = getStorageKey(roomId);
	const raw = window.sessionStorage.getItem(key);
	if (!raw) {
		return {};
	}

	window.sessionStorage.removeItem(key);

	try {
		const parsed = JSON.parse(raw);
		return {
			returnTab: typeof parsed?.returnTab === 'string' ? parsed.returnTab : undefined,
			returnContext: typeof parsed?.returnContext === 'string' ? parsed.returnContext : undefined,
		};
	} catch {
		return {};
	}
};
