import { stat } from 'node:fs/promises';

import { resolvePrivateAsset } from './privateAssets';

export const CAMERA_BACKGROUNDS_PATH = '/video-conference/backgrounds';

/** The backgrounds every call is offered, by id, in the order they are shown. */
const CAMERA_BACKGROUNDS = new Map<string, string>([]);

export const CAMERA_BACKGROUND_IDS = [...CAMERA_BACKGROUNDS.keys()];

/** The file behind a background's id. Throws for an id the workspace does not offer. */
export const resolveCameraBackground = (id: string): string => {
	const file = CAMERA_BACKGROUNDS.get(id);
	if (!file) {
		throw new Error(`No camera background with id ${id}`);
	}
	return resolvePrivateAsset(`video-conference/backgrounds/${file}`);
};

/** The backgrounds the workspace has, each with the URL to load it from, leaving out any whose file is missing. */
export const listCameraBackgrounds = async (): Promise<{ id: string; url: string }[]> => {
	const base = `${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''}${CAMERA_BACKGROUNDS_PATH}`;
	const present = await Promise.all(
		CAMERA_BACKGROUND_IDS.map(async (id) => (await stat(resolveCameraBackground(id)).catch(() => undefined))?.isFile()),
	);
	return CAMERA_BACKGROUND_IDS.filter((_, index) => present[index]).map((id) => ({ id, url: `${base}/${id}` }));
};
