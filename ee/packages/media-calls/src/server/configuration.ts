import { MediaCallCastDirector } from './CastDirector';
import { MediaCallServer } from './MediaCallServer';
import { setCastDirector, setMediaCallServer } from './injection';

export const castDirector = new MediaCallCastDirector();
export const callServer = new MediaCallServer();

setCastDirector(castDirector);
setMediaCallServer(callServer);
