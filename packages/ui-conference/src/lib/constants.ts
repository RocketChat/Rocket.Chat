import type { JoinableVideoConference } from '@rocket.chat/core-typings';

/** How many faces the preflight has room to show before it starts counting instead. */
export const PREFLIGHT_FACES_SHOWN = 10;

export const MESSAGE_PREVIEWS_SHOWN = 3;

/** For a window too small to dock a panel, where a stack of them would cover the call. */
export const MESSAGE_PREVIEWS_SHOWN_COMPACT = 1;

export const MESSAGE_PREVIEW_VISIBLE_MS = 8_000;

/** A call can only be turned down while it is still asking: one already answered, either way, has nothing left to decline. */
export const canDeclineCall = (call: JoinableVideoConference): boolean => !call.declined && !call.joined;
