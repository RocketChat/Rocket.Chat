/**
 * Emoji Configuration using emoji-toolkit (JoyPixels)
 *
 * This file replaces the deprecated emojione library with emoji-toolkit.
 * The legacy patches for missing emojis (lines 6-165 of the old file) have been removed
 * as emoji-toolkit v7+ includes complete Unicode 13-16 support.
 *
 * Fixes: https://github.com/RocketChat/Rocket.Chat/issues/38247
 */
import joypixels from 'emoji-toolkit';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// Configure emoji-toolkit for sprite mode (matches Rocket.Chat's existing behavior)
joypixels.sprites = true;
joypixels.spriteSize = '32';
joypixels.ascii = true;

// For backwards compatibility, we expose the library under the old name
// This allows existing code that references `emojione` to continue working
const emojione = joypixels;

const isEmojiSupported = (str: string): string => {
	return joypixels.shortnameToImage(str);
};

export const getEmojiConfig = () => ({
	emojione,
	emojisByCategory,
	emojiCategories,
	toneList,
	render: joypixels.toImage,
	renderPicker: joypixels.shortnameToImage,
	sprites: true,
	isEmojiSupported,
});
