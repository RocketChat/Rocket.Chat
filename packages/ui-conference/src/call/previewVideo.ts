import { createContext, useContext } from 'react';

/** A camera track the preflight can show, whatever SDK opened it. */
export type PreviewVideoTrack = {
	attach(element: HTMLVideoElement): unknown;
	detach(element: HTMLVideoElement): unknown;
};

/** The preflight's camera, once it is open, and whether opening it failed. */
export type PreviewVideo = { track?: PreviewVideoTrack; error: boolean };

const NO_PREVIEW_VIDEO: PreviewVideo = { error: false };

/** Filled by whichever provider opens the preflight's camera; with none, there is no camera to show. */
export const PreviewVideoContext = createContext<PreviewVideo>(NO_PREVIEW_VIDEO);

export const usePreviewVideo = (): PreviewVideo => useContext(PreviewVideoContext);
