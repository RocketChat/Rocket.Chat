import { uiKitModal, UiKitParserModal, BlockContext } from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import { createContext } from 'preact';
import { useCallback, useContext, useState } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import { Button } from '../../Button';
import { ButtonGroup } from '../../ButtonGroup';
import { FormField, TextInput } from '../../Form';
import { Modal } from '../../Modal';
import Block, { useBlockActionDispatcher } from '../message/Block';
import { MessageParser } from '../message';
import Surface from '../message/Surface';
import { createModalState, isInputElementBlock, recordInput } from './state';
import type { ModalViewState } from './state';

type ViewBlock = { type: string; blockId?: string; [key: string]: any };

export type UiKitModalView = {
	id: string;
	title: { text: string };
	submit?: { text: { text: string } };
	close?: { text: { text: string } };
	blocks: ViewBlock[];
	state?: ModalViewState;
};

const PlainTextInputElement = ({ actionId, initialValue, placeholder, multiline }: any) => {
	const dispatch = useBlockActionDispatcher(actionId);
	const onInput = useCallback(
		({ currentTarget }: { currentTarget: HTMLInputElement }) => dispatch({ value: currentTarget.value }),
		[dispatch],
	);

	return multiline ? (
		<textarea value={initialValue} placeholder={placeholder?.text} onInput={onInput as any} />
	) : (
		<TextInput value={initialValue} placeholder={placeholder?.text} onInput={onInput as any} />
	);
};

const ErrorsContext = createContext<Record<string, string>>({});

const InputField = ({ label, hint, actionId, children }: { label?: string; hint?: string; actionId: string; children: ComponentChild }) => {
	const errors = useContext(ErrorsContext);

	return (
		<FormField label={label} description={hint} error={errors[actionId]}>
			{children}
		</FormField>
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

	input = ({ appId, blockId, label, element, hint }: any, context: any, index: any) => {
		if (context !== BlockContext.BLOCK) {
			return null;
		}

		return (
			<Block key={index} appId={appId} blockId={blockId}>
				<InputField label={label?.text} hint={hint?.text} actionId={element.actionId}>
					{this.renderInputBlockElement(element, 0)}
				</InputField>
			</Block>
		);
	};

	plain_text_input = (element: any, context: any, index: any) =>
		context === BlockContext.BLOCK ? null : <PlainTextInputElement key={index} {...element} />;
}

export const modalParser = new ModalParser();

const renderBlocks = uiKitModal(modalParser, { engine: 'livechat' }) as (blocks: any) => ComponentChild[];

export type UiKitModalProps = {
	appId: string;
	view: UiKitModalView;
	errors?: Record<string, string>;
	dispatchBlockAction: (args: { appId: string; actionId: string; payload: unknown }) => unknown;
	onSubmit: (state: ModalViewState) => Promise<void> | void;
	onClose: (state: ModalViewState) => Promise<void> | void;
};

export const UiKitModal = ({ appId, view, errors = {}, dispatchBlockAction, onSubmit, onClose }: UiKitModalProps) => {
	const { t } = useTranslation();
	const [userState, setUserState] = useState<ModalViewState>({});
	const [busy, setBusy] = useState(false);

	const state = createModalState(view.blocks, userState);

	const dispatchAction = useCallback(
		({ blockId, actionId, payload }: { blockId?: string; actionId: string; payload: any }) => {
			if (blockId && isInputElementBlock(view.blocks, blockId, actionId)) {
				setUserState((current) => recordInput(current, blockId, actionId, payload));
				return;
			}

			return dispatchBlockAction({ appId, actionId, payload: { ...payload, blockId } });
		},
		[appId, dispatchBlockAction, view.blocks],
	);

	const run = useCallback(
		async (action: (state: ModalViewState) => Promise<void> | void) => {
			setBusy(true);
			try {
				await action(state);
			} finally {
				setBusy(false);
			}
		},
		[state],
	);

	return (
		<Modal open animated dismissByOverlay={false} onDismiss={() => run(onClose)}>
			<h3>{view.title.text}</h3>
			<ErrorsContext.Provider value={errors}>
				<Surface dispatchAction={dispatchAction}>{renderBlocks(view.blocks)}</Surface>
			</ErrorsContext.Provider>
			<ButtonGroup>
				<Button outline secondary disabled={busy} onClick={() => run(onClose)}>
					{view.close?.text.text ?? t('cancel')}
				</Button>
				<Button disabled={busy} onClick={() => run(onSubmit)}>
					{view.submit?.text.text ?? t('send')}
				</Button>
			</ButtonGroup>
		</Modal>
	);
};
