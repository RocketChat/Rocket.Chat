import emojione from 'emojione';

const fixClass = (html) => html.replace(/class="emojione emojione-32-/g, 'class="emojione emojione-');

export function emojioneRender(message) {
	return fixClass(emojione.toImage(message));
}

export function emojioneRenderFromShort(message) {
	return fixClass(emojione.shortnameToImage(message));
}
