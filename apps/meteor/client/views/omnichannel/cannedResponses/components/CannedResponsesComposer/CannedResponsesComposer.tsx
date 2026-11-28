import { Box, Button, PopoverSurface, PositionAnimated } from '@rocket.chat/fuselage';
import {
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposer,
	MessageComposerInput,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
} from '@rocket.chat/ui-composer';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEmojiPicker } from '@rocket.chat/ui-emoji-picker';
import type { ComponentProps, ChangeEvent } from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import InsertPlaceholderDropdown from './InsertPlaceholderDropdown';
import { Backdrop } from '../../../../../components/Backdrop';
import { emoji } from '../../../../../lib/emoji';

export type CannedResponsesComposerProps = Omit<ComponentProps<typeof MessageComposerInput>, 'onChange'> & {
	onChange: (value: string) => void;
};

const applyMarkdownSyntax = (
	textArea: HTMLTextAreaElement | null,
	char: '*' | '_' | '~' | '[]()',
	onChange: (value: string) => void,
): void => {
	if (!textArea) {
		return;
	}
	const text = textArea.value;
	const startPos = textArea.selectionStart;
	const endPos = textArea.selectionEnd;

	if (char === '[]()') {
		if (startPos !== endPos) {
			textArea.value = `${text.slice(0, startPos)}[${text.slice(startPos, endPos)}]()${text.slice(endPos)}`;
		}
	} else {
		textArea.value = `${text.slice(0, startPos)}${char}${text.slice(startPos, endPos)}${char}${text.slice(endPos)}`;
	}
	textArea.focus();

	if (char === '[]()') {
		if (startPos === endPos) {
			textArea.setSelectionRange(startPos, endPos);
		} else {
			textArea.setSelectionRange(endPos + 3, endPos + 3);
		}
	} else {
		textArea.setSelectionRange(startPos + 1, endPos + 1);
	}

	onChange(textArea.value);
};

const CannedResponsesComposer = ({ onChange, ...props }: CannedResponsesComposerProps) => {
	const { t } = useTranslation();
	const useEmojisPreference = useUserPreference('useEmojis');

	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const ref = useRef<HTMLButtonElement>(null);

	const [visible, setVisible] = useState(false);

	const { open: openEmojiPicker } = useEmojiPicker();

	const handleBold = useCallback(() => applyMarkdownSyntax(textAreaRef.current, '*', onChange), [onChange]);
	const handleItalic = useCallback(() => applyMarkdownSyntax(textAreaRef.current, '_', onChange), [onChange]);
	const handleStrike = useCallback(() => applyMarkdownSyntax(textAreaRef.current, '~', onChange), [onChange]);
	const handleLink = useCallback(() => applyMarkdownSyntax(textAreaRef.current, '[]()', onChange), [onChange]);

	const onClickEmoji = (emojiName: string): void => {
		if (textAreaRef?.current) {
			const text = textAreaRef.current.value;
			const startPos = textAreaRef.current.selectionStart;
			const emojiEntry = emoji.list[`:${emojiName}:`];
			const emojiValue = emojiEntry && 'unicode' in emojiEntry && emojiEntry.unicode ? `${emojiEntry.unicode} ` : `:${emojiName}: `;

			textAreaRef.current.value = text.slice(0, startPos) + emojiValue + text.slice(startPos);

			textAreaRef.current.focus();
			textAreaRef.current.setSelectionRange(startPos + emojiValue.length, startPos + emojiValue.length);

			onChange?.(textAreaRef.current.value);
		}
	};

	const handleOpenEmojiPicker = (): void => {
		if (!useEmojisPreference) {
			return;
		}

		if (!textAreaRef?.current) {
			throw new Error('Missing textAreaRef');
		}

		openEmojiPicker(textAreaRef.current, (emojiName: string) => onClickEmoji(emojiName));
	};

	const openPlaceholderSelect = (): void => {
		textAreaRef?.current?.focus();
		setVisible(!visible);
	};

	return (
		<MessageComposer>
			<MessageComposerInput
				ref={textAreaRef}
				rows={10}
				onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => onChange(e.target.value)}
				{...props}
			/>
			<MessageComposerToolbar>
				<MessageComposerToolbarActions aria-label={t('Message_composer_toolbox_primary_actions')}>
					<MessageComposerAction icon='emoji' disabled={!useEmojisPreference} onClick={handleOpenEmojiPicker} title={t('Emoji')} />
					<MessageComposerActionsDivider />
					<MessageComposerAction icon='bold' onClick={handleBold} title={t('Bold')} />
					<MessageComposerAction icon='italic' onClick={handleItalic} title={t('Italic')} />
					<MessageComposerAction icon='strike' onClick={handleStrike} title={t('Strikethrough')} />
					<MessageComposerAction icon='link' onClick={handleLink} title={t('Link')} />
					<MessageComposerActionsDivider />
					<Button ref={ref} size='small' onClick={openPlaceholderSelect}>
						{t('Insert_Placeholder')}
					</Button>
					{visible && (
						<Backdrop
							onClick={(): void => {
								textAreaRef?.current?.focus();
								setVisible(false);
							}}
						/>
					)}
					<PositionAnimated visible={visible ? 'visible' : 'hidden'} anchor={ref}>
						<Box width='224px'>
							<PopoverSurface elevation='1' flush>
								<Box padding={16}>
									<InsertPlaceholderDropdown onChange={onChange} textAreaRef={textAreaRef} setVisible={setVisible} />
								</Box>
							</PopoverSurface>
						</Box>
					</PositionAnimated>
				</MessageComposerToolbarActions>
			</MessageComposerToolbar>
		</MessageComposer>
	);
};

export default memo(CannedResponsesComposer);
