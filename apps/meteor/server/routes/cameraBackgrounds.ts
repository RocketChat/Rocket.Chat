import { CAMERA_BACKGROUNDS_PATH, CAMERA_BACKGROUND_IDS, resolveCameraBackground } from '../lib/cameraBackgrounds';
import { serveFiles } from '../lib/http/serveFiles';

/** Serves the backgrounds every call is offered, by id; `video-conference.backgrounds` lists them. */
serveFiles(CAMERA_BACKGROUNDS_PATH, new Map(CAMERA_BACKGROUND_IDS.map((id) => [id, () => resolveCameraBackground(id)])));
