import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import React from 'react';

import { CUSTOM_CATEGORY } from '../../../../app/emoji/client';
import EmojiElement from './EmojiElement';
import type { EmojiByCategory } from './EmojiPicker';

type EmojiCategoryRowProps = EmojiByCategory & {
	handleSelectEmoji: (e: MouseEvent<HTMLElement>) => void;
};

const EmojiCategoryRow = ({ catKey, catPositions, i18n, emojis, customItemsLimit, handleLoadMore, handleSelectEmoji }: EmojiCategoryRowProps) => {
	const t = useTranslation();

	return (
		<>
			<Box
				is='h4'
				ref={(element) => {
					catPositions.current.push({ el: element, top: element?.offsetTop });
					return element;
				}}
				className='emoji-list-category'
				id={`emoji-list-category-${catKey}`}
			>
				{t(i18n)}
			</Box>
			{emojis.list.length > 0 && (
				<Box is='ul' mb='x8' display='flex' flexWrap='wrap' className={`emoji-list emoji-category-${catKey}`}>
					<>
						{catKey === CUSTOM_CATEGORY &&
							emojis.list.map(
								({ emoji, image }, index = 1) =>
									index < customItemsLimit && <EmojiElement key={emoji + catKey} emoji={emoji} image={image} onClick={handleSelectEmoji} />,
							)}
						{!(catKey === CUSTOM_CATEGORY) &&
							emojis.list.map(({ emoji, image }) => (
								<EmojiElement key={emoji + catKey} emoji={emoji} image={image} onClick={handleSelectEmoji} />
							))}
					</>
				</Box>
			)}
			{emojis.limit && emojis.limit > 0 && emojis.list.length > emojis.limit && (
				<Box display='flex' flexDirection='column' alignItems='center' mbe='x8'>
					<Box is='a' fontScale='c1' onClick={handleLoadMore}>
						{t('Load_more')}
					</Box>
				</Box>
			)}
			{emojis.list.length === 0 && (
				<Box fontScale='c1' mb='x8'>
					{t('No_emojis_found')}
				</Box>
			)}
		</>
	);
};

export default EmojiCategoryRow;
