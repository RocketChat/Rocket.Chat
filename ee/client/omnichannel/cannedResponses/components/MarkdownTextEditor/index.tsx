import { Box, Divider } from '@rocket.chat/fuselage';
import React, { FC, memo, useCallback, useRef } from 'react';

import { EmojiPicker } from '../../../../../../app/emoji/client';
import { useUserPreference } from '../../../../../../client/contexts/UserContext';
import TextEditor from '../TextEditor';

const MarkdownTextEditor: FC = () => {
	const useEmojisPreference = useUserPreference('useEmojis');

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const useMarkdownSyntax = (char: '*' | '_' | '~' | '[]()'): (() => void) =>
		useCallback(() => {
			if (textAreaRef?.current) {
				const text = textAreaRef.current.value;
				const startPos = textAreaRef.current.selectionStart;
				const endPos = textAreaRef.current.selectionEnd;

				if (char === '[]()') {
					if (startPos !== endPos) {
						textAreaRef.current.value = `${text.slice(0, startPos)}[${text.slice(
							startPos,
							endPos,
						)}]()${text.slice(endPos)}`;
					}
				} else {
					textAreaRef.current.value = `${text.slice(0, startPos)}${char}${text.slice(
						startPos,
						endPos,
					)}${char}${text.slice(endPos)}`;
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
			}
		}, [char]);

	const onClickEmoji = (emoji: string): void => {
		if (textAreaRef?.current) {
			const text = textAreaRef.current.value;
			const startPos = textAreaRef.current.selectionStart;
			const emojiValue = `:${emoji}: `;

			textAreaRef.current.value = text.slice(0, startPos) + emojiValue + text.slice(startPos);

			textAreaRef.current.focus();
			textAreaRef.current.selectionStart = startPos + emojiValue.length;
		}
	};

	const openEmojiPicker = (): void => {
		if (!useEmojisPreference) {
			return;
		}

		if (EmojiPicker.isOpened()) {
			EmojiPicker.close();
			return;
		}

		EmojiPicker.open(textAreaRef.current, (emoji: string): void => {
			onClickEmoji(emoji);
		});
	};

	const selectPlaceholder = (): void => {
		console.log('select placeholder');
	};

	return (
		<TextEditor>
			<TextEditor.Toolbox>
				<Box display='flex' flexDirection='row'>
					<TextEditor.Toolbox.IconButton name='bold' action={useMarkdownSyntax('*')} />
					<TextEditor.Toolbox.IconButton name='italic' action={useMarkdownSyntax('_')} />
					<TextEditor.Toolbox.IconButton name='strike' action={useMarkdownSyntax('~')} />
					<TextEditor.Toolbox.IconButton name='link' action={useMarkdownSyntax('[]()')} />
					<TextEditor.Toolbox.IconButton name='emoji' action={openEmojiPicker} />
				</Box>
				<TextEditor.Toolbox.TextButton text='Insert_Placeholder' action={selectPlaceholder} />
			</TextEditor.Toolbox>
			<Divider w='full' mbe='16px' />
			<TextEditor.Textarea rows={10} ref={textAreaRef} />
		</TextEditor>
	);
};

export default memo(MarkdownTextEditor);
