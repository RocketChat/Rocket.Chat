import emojiToolkit from 'emoji-toolkit';

import { emojisByCategory, emojiCategories, toneList } from './emojiPicker';

// The old file contained a large number of fixes for the outdated emojione
// library. The new toolkit is much more well behaved; we simply expose the
// functions we care about and keep the same configuration shape so the
// rest of the system (which references `emoji.packages.emojione`) continues
// working without modification.

export const getEmojiConfig = () => {
	// emojiToolkit already includes a structured list on `emojiToolkit.emoji` or
	// regardless we can re-export the raw JSON for compatibility.
	const base = emojiToolkit;

	return {
		emojione: base,
		sprites: true,
		emojisByCategory,
		emojiCategories,
		toneList,
		render: base.toImage,
		renderPicker: base.toImage,
	};
};

// legacy helper removed; this file now only exports the simple config
