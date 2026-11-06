import { MediaCallCastDirector } from './CastDirector.js';
import { MediaCallServer } from './MediaCallServer.js';
import { setCastDirector, setMediaCallServer } from './injection.js';

export const castDirector = new MediaCallCastDirector();
export const callServer = new MediaCallServer();

setCastDirector(castDirector);
setMediaCallServer(callServer);
