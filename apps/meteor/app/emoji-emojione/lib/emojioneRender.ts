import emojione from 'emojione';

export function emojioneRender(message: string): string {
	return emojione.toImage(message);
}

export function emojioneRenderFromShort(message: string): string {
	return emojione.shortnameToImage(message);
}
