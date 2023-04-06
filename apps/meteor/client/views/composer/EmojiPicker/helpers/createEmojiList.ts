import { emoji } from '../../../../../app/emoji/lib/rocketchat';

export const createEmojiList = (category: string, actualTone: number | null) => {
	const emojiList = [];
	const emojiPackages = Object.values(emoji.packages);
	emojiPackages.forEach((emojiPackage) => {
		if (!emojiPackage.emojisByCategory || !emojiPackage.emojisByCategory[category]) {
			return;
		}

		const total = emojiPackage.emojisByCategory[category].length;
		// const listTotal = limit ? Math.min(limit, total) : total;

		for (let i = 0; i < total; i++) {
			const current = emojiPackage.emojisByCategory[category][i];

			const tone = actualTone && actualTone > 0 && emojiPackage.toneList.hasOwnProperty(current) ? `_tone${actualTone}` : '';
			emojiList.push({ emoji: current, image: emojiPackage.renderPicker(`:${current}${tone}:`) });
		}
	});

	return emojiList;
};
