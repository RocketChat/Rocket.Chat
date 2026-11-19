import { TextAreaInput } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useState } from 'react';

import { useRichTextMentionNames } from '../hooks/useRichTextMentionNames.js';
import { useStringFromTextObject } from '../hooks/useStringFromTextObject.js';
import { useUiKitState } from '../hooks/useUiKitState.js';
import type { BlockProps } from '../utils/BlockProps.js';
import { richTextFromMarkdown } from '../utils/richText/richTextFromMarkdown.js';
import { richTextToMarkdown } from '../utils/richText/richTextToMarkdown.js';

export type RichTextInputElementProps = BlockProps<UiKit.RichTextInputElement>;

const RichTextInputElement = ({ block, context }: RichTextInputElementProps) => {
	const [{ loading, value, error, onKeyDown }, action] = useUiKitState(block, context);
	const fromTextObjectToString = useStringFromTextObject();
	const names = useRichTextMentionNames(value);

	// The user edits Markdown; the state keeps the parsed block, so the text is held apart from it.
	const [text, setText] = useState<string | undefined>();

	return (
		<TextAreaInput
			disabled={loading}
			id={block.actionId}
			autoFocus={block.focus_on_load}
			name={block.actionId}
			rows={6}
			error={error}
			value={text ?? (value ? richTextToMarkdown(value, names) : '')}
			onChange={(event) => {
				setText(event.currentTarget.value);
				return action({ target: { value: richTextFromMarkdown(event.currentTarget.value) } });
			}}
			onKeyDown={onKeyDown}
			placeholder={fromTextObjectToString(block.placeholder)}
		/>
	);
};

export default memo(RichTextInputElement);
