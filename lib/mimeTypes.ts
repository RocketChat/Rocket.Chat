import mime from 'mime-type/with-db';

mime.define('image/vnd.microsoft.icon', { source: 'custom', extensions: ['ico'] }, mime.dupAppend);
mime.define('image/x-icon', { source: 'custom', extensions: ['ico'] }, mime.dupAppend);

mime.types.wav = 'audio/wav';
mime.types.ico = 'image/x-icon';

export { mime };
