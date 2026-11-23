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
	/** How many pictures of their own a participant may keep. */
	imageLimit: number;
	select: (effect: BackgroundEffect) => void;
	/** Off is *None*; on is the last effect used. */
	toggle: () => void;
	addImage: (file: File) => void;
	removeImage: (id: string) => void;
};

export const [BackgroundEffectProvider, useBackgroundEffectSelection] =
	createRequiredContext<BackgroundEffectSelection>('BackgroundEffect');

export const BLUR_LEVELS: BlurLevel[] = ['light', 'medium', 'strong'];

export const NO_BACKGROUND_EFFECT: BackgroundEffect = { kind: 'none' };

export const isBackgroundEffect = (value: unknown): value is BackgroundEffect => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const { kind, level, id } = value as Record<string, unknown>;
	switch (kind) {
		case 'none':
			return true;
		case 'blur':
			return BLUR_LEVELS.includes(level as BlurLevel);
		case 'preset':
		case 'image':
			return typeof id === 'string' && id.length > 0;
		default:
			return false;
	}
};

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
	imageLimit: 0,
	select: ignore,
	toggle: ignore,
	addImage: ignore,
	removeImage: ignore,
};
