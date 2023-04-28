import { Box, Divider, PositionAnimated, Tile } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo, useCallback, useRef, useState } from 'react';

import { Backdrop } from '../../../../../../client/components/Backdrop';
import { useEmojiPicker } from '../../../../../../client/contexts/EmojiPickerContext';
import TextEditor from '../TextEditor';
import InsertPlaceholderDropdown from './InsertPlaceholderDropdown';

const MarkdownTextEditor: FC<{ onChange: any; value: string }> = ({ onChange, value }) => {
	const t = useTranslation();
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

				onChange(textAreaRef.current.value);
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

			onChange(textAreaRef.current.value);
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
		<TextEditor>
			<TextEditor.Toolbox>
				<Box display='flex' flexDirection='row'>
					<TextEditor.Toolbox.IconButton name='bold' action={useMarkdownSyntax('*')} title={t('Bold')} />
					<TextEditor.Toolbox.IconButton name='italic' action={useMarkdownSyntax('_')} title={t('Italic')} />
					<TextEditor.Toolbox.IconButton name='strike' action={useMarkdownSyntax('~')} title={t('Strike')} />
					<TextEditor.Toolbox.IconButton name='link' action={useMarkdownSyntax('[]()')} title={t('Link')} />
					<TextEditor.Toolbox.IconButton name='emoji' action={handleOpenEmojiPicker} title={t('Emoji')} />
				</Box>
				<TextEditor.Toolbox.TextButton text='Insert_Placeholder' action={openPlaceholderSelect} ref={ref} />
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
			</TextEditor.Toolbox>
			<Divider w='full' mbe='16px' />
			<TextEditor.Textarea value={value} onChange={onChange} rows={10} ref={textAreaRef} />
		</TextEditor>
	);
};

export default memo(MarkdownTextEditor);
