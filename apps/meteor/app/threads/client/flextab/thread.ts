import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import type { IMessage, IEditedMessage, ISubscription, IRoom, IThreadMainMessage } from '@rocket.chat/core-typings';
import type { ContextType } from 'react';

import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { upsertMessageBulk } from '../../../ui-utils/client/lib/RoomHistoryManager';
import { Messages } from '../../../models/client';
import { getUserPreference } from '../../../utils/client';
import { settings } from '../../../settings/client';
import { callbacks } from '../../../../lib/callbacks';
import { getCommonRoomEvents } from '../../../ui/client/views/app/lib/getCommonRoomEvents';
import type { MessageBoxTemplateInstance } from '../../../ui-message/client/messageBox/messageBox';
import type { MessageContext } from '../../../../client/views/room/contexts/MessageContext';
import type { ChatContext } from '../../../../client/views/room/contexts/ChatContext';
import type MessageHighlightContext from '../../../../client/views/room/MessageList/contexts/MessageHighlightContext';
import { withDebouncing, withThrottling } from '../../../../lib/utils/highOrderFunctions';
import './thread.html';

export type ThreadTemplateInstance = Blaze.TemplateInstance<{
	mainMessage: IThreadMainMessage;
	subscription?: ISubscription;
	rid: IRoom['_id'];
	tabBar: {
		openRoomInfo: (username: string) => void;
	};
	chatContext: ContextType<typeof ChatContext>;
	messageContext: ContextType<typeof MessageContext>;
	messageHighlightContext: ContextType<typeof MessageHighlightContext>;
	sendToChannel: boolean;
	onSend?: () => void;
}> & {
	firstNode: HTMLElement;
	wrapper?: HTMLElement;
	Threads: Mongo.Collection<Omit<IMessage, '_id'>, IMessage> & {
		direct: Mongo.Collection<Omit<IMessage, '_id'>, IMessage>;
		queries: unknown[];
	};
	threadsObserve?: Meteor.LiveQueryHandle;
	callbackRemove?: () => void;
	state: ReactiveDict<{
		rid: string;
		tmid?: string;
		loading?: boolean;
		jump?: string | null;
		editingMID?: IMessage['_id'];
	}>;
	closeThread: () => void;
	loadMore: () => Promise<void>;
	atBottom?: boolean;
	sendToBottom: () => void;
	sendToBottomIfNecessary: () => void;
	lastJump?: string;
};

const sort = { ts: 1 };

Template.thread.events({
	...getCommonRoomEvents(),
	'scroll .js-scroll-thread': withThrottling({ wait: 150 })(({ currentTarget: e }: JQuery.ScrollEvent, i: ThreadTemplateInstance) => {
		i.atBottom = e.scrollTop >= e.scrollHeight - e.clientHeight;
	}),
	'click .toggle-hidden'(e: JQuery.ClickEvent) {
		const id = e.currentTarget.dataset.message;
		document.querySelector(`#thread-${id}`)?.classList.toggle('message--ignored');
	},
});

Template.thread.helpers({
	mainMessage() {
		const { Threads, state } = Template.instance() as ThreadTemplateInstance;
		const tmid = state.get('tmid');
		return Threads.findOne({ _id: tmid });
	},
	isLoading() {
		return (Template.instance() as ThreadTemplateInstance).state.get('loading') !== false;
	},
	messages() {
		const { Threads, state } = Template.instance() as ThreadTemplateInstance;
		const tmid = state.get('tmid');

		return Threads.find({ tmid, _id: { $ne: tmid } }, { sort });
	},
	customClass(msg: IMessage) {
		const { state } = Template.instance() as ThreadTemplateInstance;
		return msg._id === state.get('editingMID') ? 'editing' : '';
	},
	customClassMain() {
		const { state } = Template.instance() as ThreadTemplateInstance;
		return ['thread-main', state.get('tmid') === state.get('editingMID') ? 'editing' : ''].filter(Boolean).join(' ');
	},
	_messageContext(this: ThreadTemplateInstance['data']) {
		const result = messageContext.call(this, { rid: this.mainMessage?.rid });
		return {
			...result,
			settings: {
				...result.settings,
				showReplyButton: false,
				showreply: false,
			},
		};
	},
	messageBoxData(): MessageBoxTemplateInstance['data'] {
		const instance = Template.instance() as ThreadTemplateInstance;
		const {
			mainMessage: { rid, _id: tmid } = {},
			subscription,
			chatContext,
			sendToChannel,
		} = Template.currentData() as ThreadTemplateInstance['data'];

		if (!chatContext) {
			throw new Error('chatContext is not defined');
		}

		const showFormattingTips = settings.get('Message_ShowFormattingTips');

		return {
			chatContext,
			showFormattingTips,
			tshow: sendToChannel,
			subscription,
			rid: rid ?? '',
			tmid,
			onSend: async (
				_event: Event,
				{
					value: text,
					tshow,
				}: {
					value: string;
					tshow?: boolean;
				},
			) => {
				instance.sendToBottom();

				instance.data.onSend?.();

				await chatContext.flows.sendMessage({
					text,
					tshow,
				});
			},
			onEscape: () => {
				instance.closeThread();
			},
			onNavigateToPreviousMessage: () => chatContext.messageEditing.toPreviousMessage(),
			onNavigateToNextMessage: () => chatContext.messageEditing.toNextMessage(),
			onUploadFiles: (files: readonly File[]) => {
				return chatContext.flows.uploadFiles(files);
			},
		};
	},
	hideUsername() {
		return getUserPreference(Meteor.userId(), 'hideUsernames') ? 'hide-usernames' : undefined;
	},
	// TODO: remove this
	chatContext() {
		const { chatContext } = (Template.instance() as ThreadTemplateInstance).data;
		return () => chatContext;
	},
	// TODO: remove this
	messageContext() {
		const { messageContext } = (Template.instance() as ThreadTemplateInstance).data;
		return () => messageContext;
	},
});

Template.thread.onCreated(async function (this: ThreadTemplateInstance) {
	this.Threads = new Mongo.Collection<Omit<IMessage, '_id'>, IMessage>(null) as Mongo.Collection<Omit<IMessage, '_id'>, IMessage> & {
		direct: Mongo.Collection<Omit<IMessage, '_id'>, IMessage>;
		queries: unknown[];
	};

	const preferenceState = getUserPreference(Meteor.userId(), 'alsoSendThreadToChannel');

	let sendToChannel;
	switch (preferenceState) {
		case 'always':
			sendToChannel = true;
			break;
		case 'never':
			sendToChannel = false;
			break;
		default:
			sendToChannel = !this.data.mainMessage?.tcount ?? true;
	}

	const { mainMessage } = Template.currentData() as ThreadTemplateInstance['data'];

	this.state = new ReactiveDict(undefined, {
		sendToChannel,
		tmid: mainMessage?._id,
		rid: mainMessage?.rid,
	});

	this.loadMore = async () => {
		const { tmid } = Tracker.nonreactive(() => this.state.all());
		if (!tmid) {
			return;
		}

		this.state.set('loading', true);

		const messages = await callWithErrorHandling('getThreadMessages', { tmid });

		upsertMessageBulk({ msgs: messages }, this.Threads);
		upsertMessageBulk({ msgs: messages }, Messages);

		Tracker.afterFlush(() => {
			this.state.set('loading', false);
		});
	};

	this.closeThread = () => {
		const {
			route,
			params: { context, tab, ...params },
		} = FlowRouter.current();
		if (!route || !route.name) {
			throw new Error('FlowRouter.current().route.name is undefined');
		}
		FlowRouter.go(route.name, params);
	};
});

Template.thread.onRendered(function (this: ThreadTemplateInstance) {
	const rid = Tracker.nonreactive(() => this.state.get('rid'));
	if (!rid) {
		throw new Error('No rid found');
	}

	this.atBottom = true;
	this.wrapper = this.find('.js-scroll-thread');

	this.sendToBottom = withThrottling({ wait: 300 })(() => {
		this.atBottom = true;
		if (this.wrapper) {
			this.wrapper.scrollTop = this.wrapper.scrollHeight;
		}
	});

	this.sendToBottomIfNecessary = () => {
		this.atBottom && this.sendToBottom();
	};

	const list = this.firstNode.querySelector('.js-scroll-thread ul');

	if (!list) {
		throw new Error('Could not find list element');
	}

	const observer = new ResizeObserver(this.sendToBottomIfNecessary);
	observer.observe(list);

	this.autorun(() => {
		const rid = this.state.get('rid');
		const tmid = this.state.get('tmid');
		if (!rid) {
			return;
		}
		this.callbackRemove?.();

		this.callbackRemove = () => callbacks.remove('streamNewMessage', `thread-${rid}`);

		callbacks.add(
			'streamNewMessage',
			withDebouncing({ wait: 1000 })((msg: IEditedMessage) => {
				if (Session.get('openedRoom') !== msg.rid || rid !== msg.rid || msg.editedAt || msg.tmid !== tmid) {
					return;
				}
				Meteor.call('readThreads', tmid);
			}),
			callbacks.priority.MEDIUM,
			`thread-${rid}`,
		);
	});

	this.autorun(() => {
		const tmid = this.state.get('tmid');
		this.threadsObserve?.stop();

		this.threadsObserve = Messages.find(
			{ $or: [{ tmid }, { _id: tmid }], _hidden: { $ne: true } },
			{
				fields: {
					collapsed: 0,
					threadMsg: 0,
					repliesCount: 0,
				},
			},
		).observe({
			added: ({ _id, ...message }: IMessage) => {
				this.Threads.upsert({ _id }, message);
			},
			changed: ({ _id, ...message }: IMessage) => {
				this.Threads.update({ _id }, message);
			},
			removed: ({ _id }: IMessage) => this.Threads.remove(_id),
		});

		this.loadMore();
	});

	this.autorun(() => {
		FlowRouter.watchPathChange();
		const jump = FlowRouter.getQueryParam('jump');
		const { mainMessage } = Template.currentData() as ThreadTemplateInstance['data'];
		this.state.set({
			tmid: mainMessage?._id,
			rid: mainMessage?.rid,
			jump,
		});
	});

	this.autorun(() => {
		const jump = this.state.get('jump');
		const loading = this.state.get('loading');

		if (jump && this.lastJump !== jump && loading === false) {
			this.lastJump = jump;
			this.find('.js-scroll-thread').style.scrollBehavior = 'smooth';
			this.state.set('jump', null);
			Tracker.afterFlush(() => {
				const message = this.find(`#thread-${jump}`);
				message.classList.add('highlight');
				const removeClass = () => {
					message.classList.remove('highlight');
					message.removeEventListener('animationend', removeClass);
				};
				message.addEventListener('animationend', removeClass);
				setTimeout(() => {
					message.scrollIntoView();
				}, 300);
			});
		}
	});

	this.autorun(() => {
		const { Threads, state } = Template.instance() as ThreadTemplateInstance;
		const tmid = state.get('tmid');
		const threads = Threads.findOne({ $or: [{ tmid }, { _id: tmid }] });
		const isLoading = state.get('loading');

		if (!isLoading && !threads) {
			this.closeThread();
		}
	});

	this.autorun(() => {
		const { messageHighlightContext } = Template.currentData() as ThreadTemplateInstance['data'];

		this.state.set('editingMID', messageHighlightContext.highlightMessageId);
	});
});

Template.thread.onDestroyed(function (this: ThreadTemplateInstance) {
	const { Threads, threadsObserve, callbackRemove } = this;
	Threads.remove({});
	threadsObserve?.stop();

	callbackRemove?.();
});
