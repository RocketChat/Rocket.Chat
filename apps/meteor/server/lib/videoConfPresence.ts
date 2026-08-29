import type { IUser, VideoConference } from '@rocket.chat/core-typings';

/**
 * Asks a provider who is in a call's room right now.
 *
 * Returns the ids of the members it can see, or `undefined` for "no answer" — which is both what a provider with
 * no such API says and what a reachable one says when the request fails. The distinction matters: an empty array
 * is the provider stating that the room is empty, while `undefined` is silence, and silence must never be read as
 * absence.
 */
export type VideoConfPresenceProbe = (call: Pick<VideoConference, '_id' | 'providerName'>) => Promise<IUser['_id'][] | undefined>;

const probes = new Map<string, VideoConfPresenceProbe>();

/**
 * Where a provider can offer to say who is in its rooms.
 *
 * Optional on purpose. Presence is held by leases the conference window renews, which works for every provider
 * because that window is ours whoever runs the media. A probe is an upgrade on top of that, not a dependency: it
 * renews leases from the server side, so a call window whose timers the browser has throttled — or which is
 * behind a network that drops our heartbeat — is still recognised as being in the call. Providers reached by URL
 * (Jitsi, Meet, Pexip as we drive it) register nothing and lose nothing but that.
 */
export const videoConfPresence = {
	registerProbe(providerName: string, probe: VideoConfPresenceProbe): void {
		probes.set(providerName.toLowerCase(), probe);
	},

	unregisterProbe(providerName: string): void {
		probes.delete(providerName.toLowerCase());
	},

	getProbe(providerName: string): VideoConfPresenceProbe | undefined {
		return probes.get(providerName.toLowerCase());
	},
};
