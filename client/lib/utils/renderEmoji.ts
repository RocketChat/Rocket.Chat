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

export const getEmojiClassNameAndDataTitle = (
	emojiName: string,
): { 'className': string; 'data-title': string; 'children': string } => {
	const html = renderEmoji(emojiName);
	if (!html) {
		return { 'className': '', 'data-title': '', 'children': '' };
	}
	const result =
		/class="(?<className>[a-z_ \-0-9]+)" title="(?<datatitle>[\:a-z_\-]+)">(?<children>[^\<]+)</.exec(
			html,
		);
	if (!result) {
		return { 'className': '', 'data-title': '', 'children': '' };
	}

	const { groups } = result;
	return {
		'className': groups?.className,
		'data-title': groups?.datatitle,
		'children': groups?.children,
	} as unknown as ReturnType<typeof getEmojiClassNameAndDataTitle>;
};
