import { Divider } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React, { useRef } from 'react';

import TextEditor from '.';

export default {
	title: 'Enterprise/Omnichannel/TextEditor',
	component: TextEditor,
} as ComponentMeta<typeof TextEditor>;

export const Default: ComponentStory<typeof TextEditor> = () => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const action = () => {
		if (!textAreaRef.current) {
			return;
		}

		const text = textAreaRef.current.value;
		const startPos = textAreaRef.current.selectionStart;
		const endPos = textAreaRef.current.selectionEnd;
		textAreaRef.current.value = `${text.slice(0, startPos)}*${text.slice(startPos, endPos)}*${text.slice(endPos)}`;
		textAreaRef.current.focus();
		textAreaRef.current.setSelectionRange(startPos + 1, endPos + 1);
	};

	return (
		<TextEditor>
			<TextEditor.Toolbox>
				<TextEditor.Toolbox.IconButton name='bold' action={action} />
				<TextEditor.Toolbox.TextButton text='Insert_Placeholder' action={action} />
			</TextEditor.Toolbox>
			<Divider w='full' mbe='16px' />
			<TextEditor.Textarea rows={10} ref={textAreaRef} />
		</TextEditor>
	);
};
Default.storyName = 'TextEditor';
