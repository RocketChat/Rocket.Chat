import emojione from 'emoji-toolkit';

export function emojioneRender(message) {
	return emojione.toImage(message);
}

export function emojioneRenderFromShort(message) {
	return emojione.shortnameToImage(message);
}
