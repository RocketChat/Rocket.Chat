import emojione from 'emojione';

export function emojioneRender(message) {
	return emojione.shortnameToImage(message).replace(/class="emojione emojione-32-/g, 'class="emojione emojione-');
}
