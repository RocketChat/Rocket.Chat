import { createContext, useContext } from 'react';

export type BackgroundEffect = { mode: 'none' } | { mode: 'blur' } | { mode: 'image'; imageUrl: string };

/** Enough for a call to offer a few backgrounds to switch between, without holding on to more than it shows. */
export const MAX_BACKGROUND_IMAGES = 6;

export const isSameBackgroundEffect = (a: BackgroundEffect, b: BackgroundEffect): boolean =>
	a.mode === b.mode && (a.mode !== 'image' || (b.mode === 'image' && a.imageUrl === b.imageUrl));

/** What is behind the reader in the camera they send, for the appearance panel. */
export type BackgroundEffectSelection = {
	current: BackgroundEffect;
	/** The effect on its way to the camera, while there is one. Nothing else is taken until it lands. */
	applying?: BackgroundEffect;
	/** The images the workspace offers to everyone, which cannot be removed. */
	presets: string[];
	/** The images uploaded for this call, oldest first, whether or not one is in use. */
	images: string[];
	/** Whether this browser can run an effect at all; unknown until the browser has been asked. */
	supported?: boolean;
	/** The camera as it is captured, before any effect, to show what each effect would make of it. */
	cameraSource?: MediaStream;
	/** An image effect is only taken for one of `presets` or `images`. */
	select: (effect: BackgroundEffect) => void;
	/**
	 * Keeps the image for the rest of the call and puts it behind the reader, unless the browser cannot read it. Absent
	 * where an image could not outlive the screen it was added on.
	 */
	uploadImage?: (file: File) => void;
	/** Removing the image in use takes the background off. */
	removeImage?: (imageUrl: string) => void;
};

/** Filled only by a camera that can take an effect, the call's or the preflight's; without one, there is nothing to offer. */
export const BackgroundEffectContext = createContext<BackgroundEffectSelection | undefined>(undefined);

export const useBackgroundEffectSelection = (): BackgroundEffectSelection | undefined => useContext(BackgroundEffectContext);
