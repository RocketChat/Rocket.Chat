import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import type { ReactiveDict } from 'meteor/reactive-dict';
import type { ReactiveVar } from 'meteor/reactive-var';

import type { FileUploadProp } from '../../../lib/fileUpload';
import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';

export type RoomTemplateInstance = CommonRoomTemplateInstance &
	Blaze.TemplateInstance<{
		_id: string;
	}> & {
		selectable: ReactiveVar<boolean>;
		resetSelection: (enabled: boolean) => void;
		selectedMessages: unknown[];
		getSelectedMessages: () => unknown[];
		selectMessages: (messages: string) => void;
		selectedRange: unknown[];
		selectablePointer: string | undefined;
		atBottom: boolean | undefined;
		sendToBottomIfNecessary: () => void;
		checkIfScrollIsAtBottom: () => void;
		observer: ResizeObserver | undefined;
		lastScrollTop: number;
		hideLeaderHeader: ReactiveVar<boolean>;
		isAtBottom: (threshold?: number) => boolean;
		sendToBottom: () => void;
		state: ReactiveDict<{
			announcement: string;
			count: number;
			subscribed: boolean;
			lastMessage: Date;
			autoTranslate: unknown;
			autoTranslateLanguage: unknown;
		}>;
		rid: string;
		subscription: ReactiveVar<ISubscription | null>;
		room: IRoom | undefined;
		unreadCount: ReactiveVar<number>;
		rolesObserve: Meteor.LiveQueryHandle | undefined;
		onWindowResize: () => void;
		onFile: (files: FileUploadProp) => void;
		userDetail: ReactiveVar<string>;
	};
