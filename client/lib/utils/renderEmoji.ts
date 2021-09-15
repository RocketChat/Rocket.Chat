import { emoji } from '../../../app/emoji/lib/rocketchat';

const emojiList = emoji.list as Record<string, { emojiPackage: string }>;
const emojiPackages = emoji.packages as Record<string, { render(emojiName: string): string }>;

export const renderEmoji = (emojiName: string): string | undefined => {
	const emojiPackageName = emojiList[emojiName]?.emojiPackage;
	if (emojiPackageName) {
		const emojiPackage = emojiPackages[emojiPackageName];
		return emojiPackage.render(emojiName);
	}

	return undefined;
};
