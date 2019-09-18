import mime from 'mime-type/with-db';

mime.types.wav = 'audio/wav';
mime.define('image/vnd.microsoft.icon', { extensions: ['ico'] }, mime.dupAppend);
mime.define('image/x-icon', { extensions: ['ico'] }, mime.dupAppend);
mime.types.ico = 'image/x-icon';

export { mime };
