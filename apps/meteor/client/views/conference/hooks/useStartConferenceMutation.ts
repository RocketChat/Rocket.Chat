import type { CallPreferences } from '@rocket.chat/ui-conference';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

type StartConferenceMutationOptions = {
	rid: string;
	/** The link address the conference is started under, for a start from a conference link. */
	customUrl?: string;
	/** Whether the call is direct: only a direct call is cancelled when its starter fails to join it. */
	isDirect: boolean;
	onStarted: (callId: string) => void;
};

/**
 * Starts a conference and joins it with the devices chosen on the preflight. The join is cached for the call
 * before the call is reported to `onStarted`.
 */
export const useStartConferenceMutation = ({ rid, customUrl, isDirect, onStarted }: StartConferenceMutationOptions) => {
	const queryClient = useQueryClient();
	const startConference = useEndpoint('POST', '/v1/video-conference.start');
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const cancelConference = useEndpoint('POST', '/v1/video-conference.cancel');

	const {
		mutate: start,
		isPending: starting,
		error,
		reset,
	} = useMutation({
		mutationFn: async ({ state, name, ring }: { state: CallPreferences; name?: string; ring?: boolean }) => {
			// `allowRinging` is a request, not an instruction: the server decides from the room whether ringing is
			// the right way to announce this call at all, and this only says whether the caller wants it where it is.
			const { data } = await startConference({
				roomId: rid,
				title: name,
				allowRinging: ring ?? true,
				...(customUrl !== undefined && { customUrl }),
			});

			try {
				const joined = await joinConference({ callId: data.callId, state });

				return { callId: data.callId, joined };
			} catch (error) {
				// The call exists by now and the window is about to show an error page with no way back to it.
				// Cancelling ends the ring of a direct call; a group conference cannot be cancelled and nobody entered it.
				if (isDirect) {
					try {
						await cancelConference({ callId: data.callId });
					} catch {
						// Nothing better to do with it: what the user has to hear is why the join failed.
					}
				}

				throw error;
			}
		},
		onSuccess: ({ callId, joined }) => {
			queryClient.setQueryData(videoConferenceQueryKeys.join(callId), joined);
			onStarted(callId);
		},
	});

	return { start, starting, error, reset };
};
