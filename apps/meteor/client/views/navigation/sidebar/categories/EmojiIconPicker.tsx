import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Emoji from '../../../../components/Emoji';
import { useEmojiPicker } from '../../../../contexts/EmojiPickerContext';

const buttonClass = css`
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 2.5rem;
	block-size: 2.5rem;
	padding: 0;
	color: var(--rcx-color-font-hint, #9ea2a8);
	border: 1px solid var(--rcx-color-stroke-light, #cbced1);
	border-radius: var(--rcx-border-radius-medium, 0.25rem);
	background-color: var(--rcx-color-surface-light, #fff);
	cursor: pointer;

	&:hover {
		background-color: var(--rcx-color-surface-hover, #f2f3f5);
	}
`;

// Positions the clear badge over the top-end corner of the emoji button; `IconButton secondary`
// supplies the theme-aware (dark in dark theme) surface and icon colors.
const clearClass = css`
	position: absolute;
	inset-block-start: -0.375rem;
	inset-inline-end: -0.375rem;
	z-index: 1;
	border-radius: 50%;
`;

type EmojiIconPickerProps = {
	/** The currently selected emoji name (without colons), or undefined for the default folder icon. */
	icon?: string;
	onSelect: (emoji: string) => void;
	/** Clears the selected emoji, reverting to the default folder icon. */
	onClear: () => void;
};

/**
 * Slack-style emoji trigger placed before the category name input. Shows the selected emoji (or the
 * default folder icon) and opens the shared emoji picker. When an emoji is set, a small clear badge
 * reverts to the folder icon.
 */
const EmojiIconPicker = ({ icon, onSelect, onClear }: EmojiIconPickerProps) => {
	const { t } = useTranslation();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const { open } = useEmojiPicker();

	const handleOpen = () => {
		if (buttonRef.current) {
			open(buttonRef.current, onSelect);
		}
	};

	return (
		<Box position='relative' display='inline-flex' flexShrink={0} mie={8}>
			<Box
				is='button'
				type='button'
				ref={buttonRef}
				className={buttonClass}
				onClick={handleOpen}
				title={t('Add_emoji')}
				aria-label={t('Add_emoji')}
			>
				{icon ? <Emoji emojiHandle={`:${icon}:`} /> : <Icon name='folder' size='x20' />}
			</Box>
			{icon && (
				<IconButton mini secondary icon='cross' className={clearClass} onClick={onClear} title={t('Remove')} aria-label={t('Remove')} />
			)}
		</Box>
	);
};

export default EmojiIconPicker;
