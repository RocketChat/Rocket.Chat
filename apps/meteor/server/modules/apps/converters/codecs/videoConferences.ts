import type { AppsVideoConference } from '@rocket.chat/apps';
import type { VideoConference } from '@rocket.chat/core-typings';
import * as z from 'zod';

/**
 * Rocket.Chat `VideoConference` <-> Apps-Engine `AppsVideoConference`.
 *
 * Both directions are a shallow pass-through clone, matching the legacy converter. Endpoints are
 * typed with `z.custom` so no runtime validation is added yet.
 */
export const VideoConferenceCodec = z.codec(z.custom<VideoConference>(), z.custom<AppsVideoConference>(), {
	decode: (call): AppsVideoConference => ({ ...call }) as unknown as AppsVideoConference,
	encode: (call): VideoConference => ({ ...call }) as unknown as VideoConference,
});
