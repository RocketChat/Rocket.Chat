import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { EmojiPickerLoadMore, EmojiPickerNotFound, EmojiPickerCategoryWrapper } from '@rocket.chat/ui-client';
import { memo, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import EmojiElement from './EmojiElement';
import { isRowDivider, isLoadMore } from '../../../../app/emoji/client';
import type { EmojiPickerItem } from '../../../../app/emoji/client';

type EmojiCategoryRowProps = {
	customItemsLimit: number;
	handleLoadMore: () => void;
	handleSelectEmoji: (e: MouseEvent<HTMLElement>) => void;
	item: EmojiPickerItem;
};

const EmojiCategoryRow = ({ item, handleLoadMore, handleSelectEmoji }: EmojiCategoryRowProps) => {
	const { t } = useTranslation();

	const categoryRowStyle = css`
		button {
			margin-right: 0.25rem;
			margin-bottom: 0.25rem;
			&:nth-child(9n) {
				margin-right: 0;
			}
		}
	`;

	if (isRowDivider(item)) {
		return (
			<>
				<Box is='h4' fontScale='c1' pb={8} id={`emoji-list-category-${item.category}`}>
					{t(item.i18n)}
				</Box>
			</>
		);
	}

	if (isLoadMore(item)) {
		return <EmojiPickerLoadMore onClick={handleLoadMore}>{t('Load_more')}</EmojiPickerLoadMore>;
	}

	return (
		<EmojiPickerCategoryWrapper className={[categoryRowStyle /* `emoji-category-${categoryKey}` */].filter(Boolean)}>
			{item.length === 0 && <EmojiPickerNotFound>{t('No_emojis_found')}</EmojiPickerNotFound>}
			{item.map(({ emoji, image, category }) => (
				<EmojiElement key={emoji + category} emoji={emoji} image={image} onClick={handleSelectEmoji} />
			))}
		</EmojiPickerCategoryWrapper>
	);
};

export default memo(EmojiCategoryRow);
