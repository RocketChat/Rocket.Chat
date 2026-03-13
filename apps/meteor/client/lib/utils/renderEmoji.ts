import { emoji } from '../../../app/emoji/client/lib';

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

type EmojiParserResult = {
	'className'?: string;
	'name': string;
	'data-title'?: string;
	'children'?: string;
	'image'?: string;
};

const createGetEmojiClassNameAndDataTitle =
	(parser: (emojiName: string) => string | undefined) =>
	(emojiName: string): EmojiParserResult => {
		const html = parser(emojiName);
		if (!html) {
			return { 'className': '', 'data-title': '', 'children': '', 'name': '' };
		}

		const div = document.createElement('div');

		div.innerHTML = html;

		const emojiElement = div.firstElementChild;
		if (!emojiElement) {
			return { 'className': '', 'data-title': '', 'children': '', 'name': '', 'image': '' };
		}

		const styleBackgroundImage =
			emojiElement instanceof HTMLElement
				? emojiElement.style.backgroundImage
				: (Object.fromEntries((emojiElement.getAttribute('style') || '')?.split(';').map((s) => s.split(':'))) as Record<string, string>)[
						'background-image'
					];

		const imageSource = emojiElement.getAttribute('src');
		const image = styleBackgroundImage || (imageSource ? `url("${imageSource}")` : '');
		const isImageTag = emojiElement.tagName === 'IMG';

		return {
			'className': isImageTag ? '' : emojiElement.getAttribute('class') || '',
			'data-title': emojiElement.getAttribute('data-title') || emojiElement.getAttribute('title') || '',
			'name': emojiElement.getAttribute('name') || emojiElement.getAttribute('title') || '',
			'children': emojiElement.innerHTML || emojiElement.getAttribute('alt') || '',
			image,
		};
	};

export const getEmojiClassNameAndDataTitle = createGetEmojiClassNameAndDataTitle(renderEmoji);
