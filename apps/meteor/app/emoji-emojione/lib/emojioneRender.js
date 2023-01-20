import emoji-toolkit from 'emoji-toolkit';

export function emoji-toolkitRender(message) {
	return emoji-toolkit.toImage(message);
}

export function emoji-toolkitRenderFromShort(message) {
	return emoji-toolkit.shortnameToImage(message);
}
