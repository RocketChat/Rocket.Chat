import { Button, PositionAnimated, Tile } from '@rocket.chat/fuselage';
import {
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposer,
	MessageComposerInput,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
} from '@rocket.chat/ui-composer';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import InsertPlaceholderDropdown from './InsertPlaceholderDropdown';
import { Backdrop } from '../../../../components/Backdrop';
import { useEmojiPicker } from '../../../../contexts/EmojiPickerContext';

const CannedResponsesComposer = ({ onChange, ...props }: ComponentProps<typeof MessageComposerInput>) => {
	const { t } = useTranslation();
	const useEmojisPreference = useUserPreference('useEmojis');

	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const ref = useRef<HTMLButtonElement>(null);

	const [visible, setVisible] = useState(false);

	const { open: openEmojiPicker } = useEmojiPicker();

	const useMarkdownSyntax = (char: '*' | '_' | '~' | '[]()'): (() => void) =>
		useCallback(() => {
			if (textAreaRef?.current) {
				const text = textAreaRef.current.value;
				const startPos = textAreaRef.current.selectionStart;
				const endPos = textAreaRef.current.selectionEnd;

				if (char === '[]()') {
					if (startPos !== endPos) {
						textAreaRef.current.value = `${text.slice(0, startPos)}[${text.slice(startPos, endPos)}]()${text.slice(endPos)}`;
					}
				} else {
					textAreaRef.current.value = `${text.slice(0, startPos)}${char}${text.slice(startPos, endPos)}${char}${text.slice(endPos)}`;
				}
				textAreaRef.current.focus();

				if (char === '[]()') {
					if (startPos === endPos) {
						textAreaRef.current.setSelectionRange(startPos, endPos);
					} else {
						textAreaRef.current.setSelectionRange(endPos + 3, endPos + 3);
					}
				} else {
					textAreaRef.current.setSelectionRange(startPos + 1, endPos + 1);
				}

				onChange?.(textAreaRef.current.value as any);
			}
		}, [char]);

	const onClickEmoji = (emoji: string): void => {
		if (textAreaRef?.current) {
			const text = textAreaRef.current.value;
			const startPos = textAreaRef.current.selectionStart;
			const emojiValue = `:${emoji}: `;

			textAreaRef.current.value = text.slice(0, startPos) + emojiValue + text.slice(startPos);

			textAreaRef.current.focus();
			textAreaRef.current.setSelectionRange(startPos + emojiValue.length, startPos + emojiValue.length);

			onChange?.(textAreaRef.current.value as any);
		}
	};

	const handleOpenEmojiPicker = (): void => {
		if (!useEmojisPreference) {
			return;
		}

		if (!textAreaRef?.current) {
			throw new Error('Missing textAreaRef');
		}

		openEmojiPicker(textAreaRef.current, (emoji: string) => onClickEmoji(emoji));
	};

	const openPlaceholderSelect = (): void => {
		textAreaRef?.current && textAreaRef.current.focus();
		setVisible(!visible);
	};

	return (
		<MessageComposer>
			<MessageComposerInput ref={textAreaRef} rows={10} onChange={onChange} {...props} />
			<MessageComposerToolbar>
				<MessageComposerToolbarActions aria-label={t('Message_composer_toolbox_primary_actions')}>
					<MessageComposerAction icon='emoji' disabled={!useEmojisPreference} onClick={handleOpenEmojiPicker} title={t('Emoji')} />
					<MessageComposerActionsDivider />
					<MessageComposerAction icon='bold' onClick={useMarkdownSyntax('*')} title={t('Bold')} />
					<MessageComposerAction icon='italic' onClick={useMarkdownSyntax('_')} title={t('Italic')} />
					<MessageComposerAction icon='strike' onClick={useMarkdownSyntax('~')} title={t('Strikethrough')} />
					<MessageComposerAction icon='link' onClick={useMarkdownSyntax('[]()')} title={t('Link')} />
					<MessageComposerActionsDivider />
					<Button ref={ref} small onClick={openPlaceholderSelect}>
						{t('Insert_Placeholder')}
					</Button>
					<Backdrop
						display={visible ? 'block' : 'none'}
						onClick={(): void => {
							textAreaRef?.current && textAreaRef.current.focus();
							setVisible(false);
						}}
					/>
					<PositionAnimated visible={visible ? 'visible' : 'hidden'} anchor={ref}>
						<Tile elevation='1' w='224px'>
							<InsertPlaceholderDropdown onChange={onChange} textAreaRef={textAreaRef} setVisible={setVisible} />
						</Tile>
					</PositionAnimated>
				</MessageComposerToolbarActions>
			</MessageComposerToolbar>
		</MessageComposer>
	);
};

export default memo(CannedResponsesComposer);
