import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { EmojiPickerLoadMore, EmojiPickerNotFound, EmojiPickerCategoryWrapper } from '@rocket.chat/ui-client';
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

	const categoryRowStyle = css`
		button {
			margin-right: 0.25rem;
			margin-bottom: 0.25rem;
			&:nth-child(9n) {
				margin-right: 0;
			}
		}
	`;

	return (
		<Box mbe={12}>
			<Box
				is='h4'
				fontScale='c1'
				mbe={12}
				id={`emoji-list-category-${categoryKey}`}
				ref={(element) => {
					categoriesPosition.current.push({ el: element, top: element?.offsetTop });
					return element;
				}}
			>
				{t(i18n)}
			</Box>
			{emojis.list.length > 0 && (
				<EmojiPickerCategoryWrapper className={[categoryRowStyle, `emoji-category-${categoryKey}`].filter(Boolean)}>
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
		</Box>
	);
};

export default EmojiCategoryRow;
