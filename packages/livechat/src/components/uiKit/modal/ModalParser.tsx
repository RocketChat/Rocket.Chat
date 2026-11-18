import { UiKitParserModal, BlockContext } from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { TextInput } from '../../Form';
import { MessageParser } from '../message';
import InputField from './InputField';
import Block, { useBlockActionDispatcher } from '../message/Block';

const PlainTextInputElement = ({ actionId, initialValue, placeholder, multiline }: any) => {
	const dispatch = useBlockActionDispatcher(actionId);
	const [value, setValue] = useState(initialValue);
	const onInput = useCallback(
		({ currentTarget }: { currentTarget: HTMLInputElement }) => {
			setValue(currentTarget.value);
			void dispatch({ value: currentTarget.value });
		},
		[dispatch],
	);

	return multiline ? (
		<textarea value={value} placeholder={placeholder?.text} onInput={onInput as any} />
	) : (
		<TextInput value={value} placeholder={placeholder?.text} onInput={onInput} />
	);
};

// Delegates what a modal shares with a message to MessageParser, so both draw the same block the same way.
export class ModalParser extends UiKitParserModal<ComponentChild> {
	private readonly message = new MessageParser();

	private delegate = (name: keyof MessageParser) => (element: any, context: any, index: any) =>
		(this.message[name] as (e: any, c: any, i: any) => ComponentChild)(element, context, index);

	actions = this.delegate('actions');

	callout = this.delegate('callout');

	context = this.delegate('context');

	divider = this.delegate('divider');

	header = this.delegate('header');

	image = this.delegate('image');

	markdown = this.delegate('markdown');

	preview = this.delegate('preview');

	section = this.delegate('section');

	table = this.delegate('table');

	video = this.delegate('video');

	button = this.delegate('button');

	overflow = this.delegate('overflow');

	datepicker = this.delegate('datepicker');

	static_select = this.delegate('static_select');

	multi_static_select = this.delegate('multi_static_select');

	plain_text = this.delegate('plain_text');

	mrkdwn = this.delegate('mrkdwn');

	input = ({ appId, blockId, label, element, hint }: any, context: any) => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		const control = this.renderInputBlockElement(element, 0);
		if (!control) {
			return null;
		}

		return (
			<Block key={`${blockId}:${element.actionId}`} appId={appId} blockId={blockId}>
				<InputField label={label?.text} hint={hint?.text} actionId={element.actionId}>
					{control}
				</InputField>
			</Block>
		);
	};

	plain_text_input = (element: any, context: any, index: any) =>
		context === BlockContext.BLOCK ? null : <PlainTextInputElement key={index} {...element} />;
}

export const modalParser = new ModalParser();
