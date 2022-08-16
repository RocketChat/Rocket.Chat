import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import type { ReactiveDict } from 'meteor/reactive-dict';
import type { ReactiveVar } from 'meteor/reactive-var';

export type RoomTemplateInstance = Blaze.TemplateInstance<{
	_id: string;
}> & {
	selectable: ReactiveVar<boolean>;
	selectedMessages: unknown[];
	getSelectedMessages: () => unknown[];
	selectMessages: (messages: string) => void;
	selectedRange?: unknown[];
	selectablePointer?: string;
	atBottom?: boolean;
	sendToBottomIfNecessary: () => void;
	lastScrollTop: number;
	hideLeaderHeader: ReactiveVar<boolean>;
	isAtBottom: (threshold: number) => boolean;
	tabBar: unknown;
	state: ReactiveDict<{
		announcement: string;
		count: number;
		subscribed: boolean;
	}>;
	rid: string;
	subscription: ReactiveVar<ISubscription>;
	room?: IRoom;
};
