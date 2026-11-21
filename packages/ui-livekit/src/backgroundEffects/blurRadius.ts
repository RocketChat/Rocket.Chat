import type { BlurLevel } from '@rocket.chat/ui-conference';

/** A share of the frame's height, so a level looks alike at every resolution. */
const SHARE_OF_HEIGHT: Record<BlurLevel, number> = { light: 0.016, medium: 0.033, strong: 0.067 };

/** The library divides the radius by four, so radii under 8 px all blur alike; these floors keep the levels apart at 180p. */
const MIN_RADIUS: Record<BlurLevel, number> = { light: 4, medium: 8, strong: 16 };

export const blurRadiusFor = (level: BlurLevel, frameHeight: number): number =>
	Math.max(MIN_RADIUS[level], Math.round(frameHeight * SHARE_OF_HEIGHT[level]));
