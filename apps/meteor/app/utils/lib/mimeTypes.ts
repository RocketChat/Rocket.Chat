import mime from 'mime-type/with-db';

mime.types.wav = 'audio/wav';
mime.define('image/vnd.microsoft.icon', { source: '', extensions: ['ico'] }, mime.dupAppend);
mime.define('image/x-icon', { source: '', extensions: ['ico'] }, mime.dupAppend);
mime.types.ico = 'image/x-icon';

const getExtension = (param: string): string => {
	const extension = mime.extension(param);

	return !extension || typeof extension === 'boolean' ? '' : extension;
};

export { mime, getExtension };
