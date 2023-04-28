import { Box } from '@rocket.chat/fuselage';
import { EmojiPickerCategoryWrapper, EmojiPickerLoadMore, EmojiPickerNotFound } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent, MutableRefObject } from 'react';
import React from 'react';

import { CUSTOM_CATEGORY } from '../../../../app/emoji/client';
import type { EmojiByCategory, EmojiCategoryPosition } from '../../../../app/emoji/client';
import EmojiElement from './EmojiElement';

type EmojiCategoryRowProps = EmojiByCategory & {
	categoryKey: EmojiByCategory['key'];
	categoriesPosition: MutableRefObject<EmojiCategoryPosition[]>;
	customItemsLimit: number;
	handleLoadMore: () => void;
	handleSelectEmoji: (e: MouseEvent<HTMLElement>) => void;
};

const EmojiCategoryRow = ({
	categoryKey,
	categoriesPosition,
	i18n,
	emojis,
	customItemsLimit,
	handleLoadMore,
	handleSelectEmoji,
}: EmojiCategoryRowProps) => {
	const t = useTranslation();

	return (
		<>
			<Box
				is='h4'
				id={`emoji-list-category-${categoryKey}`}
				ref={(element) => {
					categoriesPosition.current.push({ el: element, top: element?.offsetTop });
					return element;
				}}
			>
				{t(i18n)}
			</Box>
			{emojis.list.length > 0 && (
				<EmojiPickerCategoryWrapper className={`emoji-category-${categoryKey}`}>
					<>
						{categoryKey === CUSTOM_CATEGORY &&
							emojis.list.map(
								({ emoji, image }, index = 1) =>
									index < customItemsLimit && (
										<EmojiElement key={emoji + categoryKey} emoji={emoji} image={image} onClick={handleSelectEmoji} />
									),
							)}
						{!(categoryKey === CUSTOM_CATEGORY) &&
							emojis.list.map(({ emoji, image }) => (
								<EmojiElement key={emoji + categoryKey} emoji={emoji} image={image} onClick={handleSelectEmoji} />
							))}
					</>
				</EmojiPickerCategoryWrapper>
			)}
			{emojis.limit && emojis?.limit > 0 && emojis.list.length > emojis.limit && (
				<EmojiPickerLoadMore onClick={handleLoadMore}>{t('Load_more')}</EmojiPickerLoadMore>
			)}
			{emojis.list.length === 0 && <EmojiPickerNotFound>{t('No_emojis_found')}</EmojiPickerNotFound>}
		</>
	);
};

export default EmojiCategoryRow;
