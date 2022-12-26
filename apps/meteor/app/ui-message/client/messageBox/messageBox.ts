import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import type { ContextType } from 'react';

import type { ChatContext } from '../../../../client/views/room/contexts/ChatContext';
import './messageBoxActions';

export type MessageBoxTemplateInstance = Blaze.TemplateInstance<{
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	readOnly: boolean;
	onSend?: (params: { value: string; tshow?: boolean }) => Promise<void>;
	onJoin?: () => Promise<void>;
	onResize?: () => void;
	onTyping?: () => void;
	onEscape?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onNavigateToNextMessage?: () => void;
	onUploadFiles?: (files: readonly File[]) => void;
	tshow?: IMessage['tshow'];
	subscription?: ISubscription;
	showFormattingTips: boolean;
	isEmbedded?: boolean;
	chatContext: ContextType<typeof ChatContext>;
}> & {
	state: ReactiveDict<{
		mustJoinWithCode?: boolean;
		isBlockedOrBlocker?: boolean;
		room?: boolean;
	}>;
	popupConfig: ReactiveVar<{
		rid: string;
		tmid?: string;
		getInput: () => HTMLTextAreaElement;
	} | null>;
	replyMessageData: ReactiveVar<IMessage[] | null>;
	isMicrophoneDenied: ReactiveVar<boolean>;
	isSendIconVisible: ReactiveVar<boolean>;
	input: HTMLTextAreaElement;
	source?: HTMLTextAreaElement;
	autogrow: {
		update: () => void;
		destroy: () => void;
	} | null;
	set: (value: string) => void;
	insertNewLine: () => void;
	send: (event: Event) => void;
	sendIconDisabled: ReactiveVar<boolean>;
};

const lastFocusedInput: HTMLTextAreaElement | undefined = undefined;

export const refocusComposer = () => {
	(lastFocusedInput ?? document.querySelector<HTMLTextAreaElement>('.js-input-message'))?.focus();
};
