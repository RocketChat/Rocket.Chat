import emojitool from 'emoji-toolkit';

export function emojioneRender(message) {
	return emojitool.toImage(message);
}

export function emojioneRenderFromShort(message) {
	return emojitool.shortnameToImage(message);
}
