import type { IGroupVideoConference, IVideoConferenceRoom } from '@rocket.chat/core-typings';
import { VideoConference, VideoConferenceRooms } from '@rocket.chat/models';
import limax from 'limax';

import { NEW_CONFERENCE_ID } from '../../../lib/videoConference/constants';

const CONFERENCE_ID_SHAPE = /^[0-9a-f]{24}$/;

const isReserved = (slug: string): boolean => slug === NEW_CONFERENCE_ID || CONFERENCE_ID_SHAPE.test(slug);

/**
 * A free address for a link titled `title`: its slug, or the slug with the lowest free `-2`, `-3`… suffix.
 *
 * An address is never shaped like a conference id or equal to one, so it reaches a link or a conference, never
 * both. `currentUrl` is the renamed link's own address, which is never a clash with itself.
 */
export const getConferenceRoomUrl = async (
	title: string,
	{ currentUrl }: { currentUrl?: IVideoConferenceRoom['url'] } = {},
): Promise<IVideoConferenceRoom['url']> => {
	const base = limax(title.trim());
	if (!base) {
		throw new Error('error-invalid-title');
	}

	const [links, liveConferences] = await Promise.all([
		VideoConferenceRooms.findUrlsStartingWith<Pick<IVideoConferenceRoom, 'url'>>(base, { projection: { url: 1 } }).toArray(),
		VideoConference.findActiveCustomUrlsStartingWith<Pick<IGroupVideoConference, 'customUrl'>>(base, {
			projection: { customUrl: 1 },
		}).toArray(),
	]);
	const taken = new Set([...links.map(({ url }) => url), ...liveConferences.map(({ customUrl }) => customUrl)]);

	for (let suffix = 1; ; suffix++) {
		const candidate = suffix === 1 ? base : `${base}-${suffix}`;
		if (candidate === currentUrl) {
			return candidate;
		}

		if (taken.has(candidate) || isReserved(candidate)) {
			continue;
		}

		if (await VideoConference.findOneById(candidate, { projection: { _id: 1 } })) {
			continue;
		}

		return candidate;
	}
};
