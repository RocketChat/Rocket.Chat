/* eslint-disable complexity */
import type { IMessage, ISubscription, IRoom } from '@rocket.chat/core-typings';
import { useContentBoxSize, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerToolbarActions, MessageComposer, MessageComposerInput, MessageComposerToolbar } from '@rocket.chat/ui-composer';
import { useUserPreference, useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, KeyboardEventHandler, KeyboardEvent, FormEventHandler } from 'react';
import React, { memo, useCallback, useRef, useState } from 'react';
import { useSubscription } from 'use-subscription';

import { createComposerAPI } from '../../../../../app/ui-message/client/messageBox/createComposerAPI';
import type { FormattingButton } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { formattingButtons } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';
import { keyCodes } from '../../../../lib/utils/keyCodes';
import { useComposerPopup } from '../../contexts/ComposerPopupContext';
import ComposerBoxPopup from '../ComposerBoxPopup';
import ComposerBoxPopupPreview from '../ComposerBoxPopupPreview';
import { useAutoGrow } from '../RoomComposer/hooks/useAutoGrow';
import { useComposerBoxPopup } from '../hooks/useComposerBoxPopup';
import { useEnablePopupPreview } from '../hooks/useEnablePopupPreview';
import { useMessageComposerMergedRefs } from '../hooks/useMessageComposerMergedRefs';
import MessageBoxFormattingToolbar from './MessageBoxFormattingToolbar';
import { useMessageBoxAutoFocus } from './hooks/useMessageBoxAutoFocus';

const handleFormattingShortcut = (
	event: KeyboardEvent<HTMLTextAreaElement>,
	formattingButtons: FormattingButton[],
	composer: ComposerAPI,
) => {
	const isMacOS = navigator.platform.indexOf('Mac') !== -1;
	const isCmdOrCtrlPressed = (isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey);

	if (!isCmdOrCtrlPressed) {
		return false;
	}

	const key = event.key.toLowerCase();

	const formatter = formattingButtons.find((formatter) => 'command' in formatter && formatter.command === key);

	if (!formatter || !('pattern' in formatter)) {
		return false;
	}

	composer.wrapSelection(formatter.pattern);
	return true;
};

const emptySubscribe = () => () => undefined;
const a: any[] = [];
const getEmptyArray = () => a;

type TextMessageBoxProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	onResize?: () => void;
	onTyping?: () => void;
	onEscape?: () => void;
	onChange?: FormEventHandler<HTMLElement>;
	tshow?: IMessage['tshow'];
	previewUrls?: string[];
	subscription?: ISubscription;
	showFormattingTips: boolean;
	isEmbedded?: boolean;
};

const TextMessageBox = ({ onTyping, onChange, rid }: TextMessageBoxProps): ReactElement => {
	const [composer, setComposer] = useState<ComposerAPI>();
	const t = useTranslation();
	const composerPlaceholder = t('Message');

	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messageComposerRef = useRef<HTMLElement>(null);
	const shadowRef = useRef<HTMLDivElement>(null);

	const storageID = `messagebox_${rid}-fileupload`;
	const callbackRef = useCallback(
		(node: HTMLTextAreaElement) => {
			if (node === null || composer) {
				return;
			}
			setComposer(createComposerAPI(node, storageID));
		},
		[composer, storageID],
	);

	const autofocusRef = useMessageBoxAutoFocus(!isMobile);

	const handler: KeyboardEventHandler<HTMLTextAreaElement> = useMutableCallback((event) => {
		const { which: keyCode } = event;
		const isSubmitKey = keyCode === keyCodes.CARRIAGE_RETURN || keyCode === keyCodes.NEW_LINE;

		if (isSubmitKey) {
			const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
			const isSending = (sendOnEnter && !withModifier) || (!sendOnEnter && withModifier);

			event.preventDefault();
			if (!isSending) {
				composer?.insertNewLine();
				return false;
			}
			return false;
		}

		if (composer && handleFormattingShortcut(event, [...formattingButtons], composer)) {
			return;
		}

		if (event.shiftKey || event.ctrlKey || event.metaKey) {
			return;
		}

		onTyping?.();
	});

	const formatters = useSubscription({
		getCurrentValue: composer?.formatters.get ?? getEmptyArray,
		subscribe: composer?.formatters.subscribe ?? emptySubscribe,
	});

	const { textAreaStyle, shadowStyle } = useAutoGrow(textareaRef, shadowRef);

	const sizes = useContentBoxSize(textareaRef);

	const composerPopupConfig = useComposerPopup();

	const {
		popup,
		focused,
		items,
		ariaActiveDescendant,
		suspended,
		select,
		commandsRef,
		callbackRef: c,
		filter,
	} = useComposerBoxPopup<{ _id: string; sort?: number }>({
		configurations: composerPopupConfig,
		composerApi: composer,
	});

	const mergedRefs = useMessageComposerMergedRefs(c, textareaRef, callbackRef, autofocusRef);

	const shouldPopupPreview = useEnablePopupPreview(filter, popup);

	return (
		<>
			{shouldPopupPreview && popup && (
				<ComposerBoxPopup select={select} items={items} focused={focused} title={popup.title} renderItem={popup.renderItem} />
			)}
			{/*
				SlashCommand Preview popup works in a weird way
				There is only one trigger for all the commands: "/"
				After that we need to the slashcommand list and check if the command exists and provide the preview
				if not the query is `suspend` which means the slashcommand is not found or doesn't have a preview
			*/}
			{popup?.preview && (
				<ComposerBoxPopupPreview
					select={select}
					items={items as any}
					focused={focused as any}
					renderItem={popup.renderItem}
					ref={commandsRef}
					rid={rid}
					suspended={suspended}
				/>
			)}
			<MessageComposer ref={messageComposerRef}>
				<MessageComposerInput
					ref={mergedRefs}
					aria-label={composerPlaceholder}
					name='msg'
					style={textAreaStyle}
					placeholder={composerPlaceholder}
					onKeyDown={handler}
					onChange={onChange}
					aria-activedescendant={ariaActiveDescendant}
				/>
				<div ref={shadowRef} style={shadowStyle} />
				<MessageComposerToolbar>
					<MessageComposerToolbarActions aria-label={t('Message_composer_toolbox_primary_actions')}>
						{composer && formatters.length > 0 && (
							<MessageBoxFormattingToolbar
								composer={composer}
								variant={sizes.inlineSize < 480 ? 'small' : 'large'}
								items={formatters}
								disabled={false}
							/>
						)}
					</MessageComposerToolbarActions>
				</MessageComposerToolbar>
			</MessageComposer>
		</>
	);
};

export default memo(TextMessageBox);
