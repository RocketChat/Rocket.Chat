import type { CallPreferences } from '@rocket.chat/ui-conference';
import { useConnectionStatus, usePermission, useStream } from '@rocket.chat/ui-contexts';
import type { VideoConferenceInfo } from '@rocket.chat/ui-video-conf';
import { videoConferenceInfoQueryKey } from '@rocket.chat/ui-video-conf';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useStartConferenceMutation } from './useStartConferenceMutation';
import { startErrorReason } from '../lib/startErrorReason';

/**
 * What the page of a conference link with nothing live shows, and the start of its conference. The link is read
 * again whenever its room announces a conference, and once each time the room starts being watched.
 */
export const usePersistentConference = (link: VideoConferenceInfo, segment: string, onStarted: (callId: string) => void) => {
	const queryClient = useQueryClient();
	const subscribeToNotifyRoom = useStream('notify-room');
	const { connected } = useConnectionStatus();
	const canRingUsers = usePermission('videoconf-ring-users');

	const { start, starting, error, reset } = useStartConferenceMutation({ rid: link.rid, customUrl: segment, isDirect: false, onStarted });

	// Subscribed per connection: one lost with the socket leaves the page watching nothing.
	useEffect(() => {
		if (!connected) {
			return;
		}

		const readAgain = () => void queryClient.invalidateQueries({ queryKey: videoConferenceInfoQueryKey(segment) });
		const stop = subscribeToNotifyRoom(`${link.rid}/videoconf`, readAgain);

		// A conference started before the subscription was in place was announced to nobody here.
		readAgain();

		return stop;
	}, [connected, link.rid, segment, queryClient, subscribeToNotifyRoom]);

	return {
		title: 'title' in link && link.title ? link.title : '',
		canStart: link.canStart === true,
		canRing: link.chatAccess.type === 'd' && canRingUsers,
		capabilities: link.capabilities,
		starting,
		error,
		/** The translation key of why the start failed, when another try will not fix it. */
		reason: startErrorReason(error),
		start: ({ state, ring }: { state: CallPreferences; ring: boolean }) => start({ state, ring }),
		reset,
	};
};
