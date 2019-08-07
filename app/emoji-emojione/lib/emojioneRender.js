import { toImage, shortnameToImage } from 'emojione';

export function emojioneRender(message) {
	return toImage(message);
}

export function emojioneRenderFromShort(message) {
	return shortnameToImage(message);
}
