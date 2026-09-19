import type { CallPreferences } from '@rocket.chat/ui-conference';
import { useEndpoint, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRoomSubscriptionQuery } from './useRoomSubscriptionQuery';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/**
 * Starts the conference this window was opened for, once its preflight has been confirmed.
 *
 * The conference does not exist until then. Clicking *call* in a room used to create it — which posts a message
 * there, rings people, and writes a call that happened — for a call the user might still walk away from. So the
 * click only opens this window; what it shows is the preflight, and confirming is what starts the call.
 *
 * It reads what the preflight needs from the room rather than from a conference: the name to offer, whether this
 * is a direct call, and what the provider can be told about devices.
 */
export const useStartConference = (rid: string) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const getCapabilities = useEndpoint('GET', '/v1/video-conference.capabilities');
	const startConference = useEndpoint('POST', '/v1/video-conference.start');
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const cancelConference = useEndpoint('POST', '/v1/video-conference.cancel');

	// The same permission the start endpoint checks before it honours `allowRinging`. Without it the request is
	// accepted and the ringing quietly dropped, so a screen that offered the choice would be promising a call
	// nobody's phone is going to make.
	const canRingUsers = usePermission('videoconf-ring-users');

	// The subscription, not the room: its `fname` is the name this reader knows the room by, which for a direct
	// message is the other person rather than a room name at all.
	const { data: subscription, isPending: isRoomPending, error: roomError } = useRoomSubscriptionQuery(rid);

	const {
		data: capabilities,
		isPending: isCapabilitiesPending,
		error: capabilitiesError,
	} = useQuery({
		queryKey: videoConferenceQueryKeys.capabilities(),
		queryFn: async () => (await getCapabilities()).capabilities,
	});

	const isDirect = subscription?.t === 'd';

	const {
		mutate: start,
		isPending: starting,
		error: startError,
	} = useMutation({
		mutationFn: async ({ state, name, ring }: { state: CallPreferences; name?: string; ring?: boolean }) => {
			// `allowRinging` is a request, not an instruction: the server decides from the room whether ringing is
			// the right way to announce this call at all, and this only says whether the caller wants it where it is.
			const { data } = await startConference({ roomId: rid, title: name, allowRinging: ring ?? true });

			try {
				const joined = await joinConference({ callId: data.callId, state });

				return { callId: data.callId, joined };
			} catch (error) {
				// The call exists by now — a message in the room, a phone ringing somewhere — and the window is about
				// to show an error page with no way back to it. Cancelling is what ends the ring and closes what was
				// just opened. Only a direct call can be cancelled (`VideoConf.cancel` refuses anything else), and a
				// group conference nobody entered is collected by the empty-call sweep instead.
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
			// Handing the join on through the cache is what stops the conference page asking the same questions
			// again the moment it opens: the user has answered them, and is already in the call.
			queryClient.setQueryData(videoConferenceQueryKeys.join(callId), joined);

			// Replaces this screen in history, so reloading the window — or reaching it again from anywhere else —
			// lands on the conference rather than starting a second one.
			router.navigate({ name: 'conference', params: { id: callId } }, { replace: true });
		},
	});

	const loading = isRoomPending || isCapabilitiesPending;

	// A room this user can't see, or one that isn't there, resolves to no subscription rather than to a failure —
	// so it has to be turned into one here. Left as it was, the preflight offers to start a call in a room named
	// with an empty string, which reads as "Meeting in " and can be confirmed.
	const noSubscription = !loading && !roomError && !subscription;

	return {
		/** The name to offer: what this reader calls the room, which is the natural name for a call in it. */
		name: subscription?.fname || subscription?.name || '',
		isDirect,
		/**
		 * Whether starting this call can ring anyone: a direct call, placed by someone the workspace lets ring
		 * people. Both halves matter — a channel announces a call rather than ringing it, and the endpoint drops
		 * the ringing of a caller without the permission whatever this screen was told.
		 */
		canRing: isDirect && canRingUsers,
		capabilities: capabilities ?? {},
		loading,
		/**
		 * Anything that stops this screen being answerable. The queries count as much as the mutation does: a
		 * capabilities or subscription request that failed leaves the preflight with nothing to offer, and
		 * returning empty defaults would show it anyway.
		 */
		error: startError ?? roomError ?? capabilitiesError ?? (noSubscription ? new Error('conference-room-unavailable') : null),
		/**
		 * Whether the call is being created. This screen stays mounted while it happens — creating the conference
		 * and joining it are two requests, and navigating away is the last thing `start` does — so the button that
		 * asked for it is what has to say so.
		 */
		starting,
		start,
	};
};
