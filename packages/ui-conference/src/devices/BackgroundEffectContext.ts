import { createRequiredContext } from '@rocket.chat/ui-media';

export type BlurLevel = 'light' | 'medium' | 'strong';

export type BackgroundEffect =
	{ kind: 'none' } | { kind: 'blur'; level: BlurLevel } | { kind: 'preset'; id: string } | { kind: 'image'; id: string };

export type BackgroundPreset = { id: string; name: string; url: string };

/** A picture of the participant's own, never uploaded. */
export type BackgroundImage = { id: string; name: string; url: string };

export type BackgroundEffectSelection = {
	supported: boolean;
	effect: BackgroundEffect;
	/** The effect being started; every control waits for it. */
	applying?: BackgroundEffect;
	presets: BackgroundPreset[];
	images: BackgroundImage[];
	select: (effect: BackgroundEffect) => void;
	/** Off is *None*; on is the last effect used. */
	toggle: () => void;
	addImage: (file: File) => void;
	removeImage: (id: string) => void;
};

export const [BackgroundEffectProvider, useBackgroundEffectSelection] =
	createRequiredContext<BackgroundEffectSelection>('BackgroundEffect');

export const BLUR_LEVELS: BlurLevel[] = ['light', 'medium', 'strong'];

export const isSameEffect = (a: BackgroundEffect | undefined, b: BackgroundEffect | undefined): boolean => {
	if (!a || !b || a.kind !== b.kind) {
		return false;
	}
	switch (a.kind) {
		case 'blur':
			return a.level === (b as typeof a).level;
		case 'preset':
		case 'image':
			return a.id === (b as typeof a).id;
		default:
			return true;
	}
};

const ignore = () => undefined;

export const BACKGROUND_EFFECTS_UNAVAILABLE: BackgroundEffectSelection = {
	supported: false,
	effect: { kind: 'none' },
	presets: [],
	images: [],
	select: ignore,
	toggle: ignore,
	addImage: ignore,
	removeImage: ignore,
};
