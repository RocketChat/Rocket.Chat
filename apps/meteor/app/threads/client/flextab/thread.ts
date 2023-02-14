import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import type { IMessage, IEditedMessage, ISubscription } from '@rocket.chat/core-typings';

import { ChatMessages } from '../../../ui/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { upsertMessageBulk } from '../../../ui-utils/client/lib/RoomHistoryManager';
import { Messages } from '../../../models/client';
import type { FileUploadProp } from '../../../ui/client/lib/fileUpload';
import { fileUpload } from '../../../ui/client/lib/fileUpload';
import { dropzoneEvents, dropzoneHelpers } from '../../../ui/client/views/app/lib/dropzone';
import { getUserPreference } from '../../../utils/client';
import { settings } from '../../../settings/client';
import { callbacks } from '../../../../lib/callbacks';
import { getCommonRoomEvents } from '../../../ui/client/views/app/lib/getCommonRoomEvents';
import { keyCodes } from '../../../../client/lib/utils/keyCodes';
import './thread.html';

type ThreadTemplateInstance = Blaze.TemplateInstance<{
	mainMessage: IMessage;
	subscription: ISubscription;
}> & {
	firstNode: HTMLElement;
	Threads: Mongo.Collection<Omit<IMessage, '_id'>, IMessage> & {
		direct: Mongo.Collection<Omit<IMessage, '_id'>, IMessage>;
		queries: unknown[];
	};
	threadsObserve?: Meteor.LiveQueryHandle;
	chatMessages: ChatMessages;
	callbackRemove?: () => void;
	state: ReactiveDict<{
		rid: string;
		tmid?: string;
		loading?: boolean;
		sendToChannel: boolean;
		jump?: string | null;
	}>;
	closeThread: () => void;
	loadMore: () => Promise<void>;
	atBottom?: boolean;
	sendToBottom: () => void;
	sendToBottomIfNecessary: () => void;
	onFile: (files: FileUploadProp) => void;
	lastJump?: string;
};

const sort = { ts: 1 };

Template.thread.events({
	...dropzoneEvents,
	...getCommonRoomEvents(),
	'click .js-close'(e: JQuery.ClickEvent) {
		e.preventDefault();
		e.stopPropagation();
		const { close } = this;
		return close?.();
	},
	'scroll .js-scroll-thread': _.throttle(({ currentTarget: e }: JQuery.ScrollEvent, i: ThreadTemplateInstance) => {
		i.atBottom = e.scrollTop >= e.scrollHeight - e.clientHeight;
	}, 150),
	'click .toggle-hidden'(e: JQuery.ClickEvent) {
		const id = e.currentTarget.dataset.message;
		document.querySelector(`#thread-${id}`)?.classList.toggle('message--ignored');
	},
});

Template.thread.helpers({
	...dropzoneHelpers,
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
	messageContext(this: { mainMessage: IMessage }) {
		const result = messageContext.call(this, { rid: this.mainMessage.rid });
		return {
			...result,
			settings: {
				...result.settings,
				showReplyButton: false,
				showreply: false,
			},
		};
	},
	messageBoxData() {
		const instance = Template.instance() as ThreadTemplateInstance;
		const {
			mainMessage: { rid, _id: tmid },
			subscription,
		} = Template.currentData() as ThreadTemplateInstance['data'];

		const showFormattingTips = settings.get('Message_ShowFormattingTips');
		const alsoSendPreferenceState = getUserPreference(Meteor.userId(), 'alsoSendThreadToChannel');

		return {
			chatMessagesInstance: instance.chatMessages,
			showFormattingTips,
			tshow: instance.state.get('sendToChannel'),
			subscription,
			rid,
			tmid,
			onSend: (
				_event: Event,
				params: {
					value: string;
					tshow?: boolean;
				},
			) => {
				instance.sendToBottom();
				if (alsoSendPreferenceState === 'default') {
					instance.state.set('sendToChannel', false);
				}
				return instance.chatMessages?.send(params);
			},
			onKeyUp: (
				event: KeyboardEvent,
				params: {
					rid: string;
					tmid?: string | undefined;
				},
			) => instance.chatMessages?.keyup(event, params),
			onKeyDown: (event: KeyboardEvent) => {
				const result = instance.chatMessages?.keydown(event);

				const { which: keyCode } = event;
				const input = event.target as HTMLTextAreaElement | null;

				if (keyCode === keyCodes.ESCAPE && !result && !input?.value.trim()) {
					instance.closeThread();
				}
			},
		};
	},
	hideUsername() {
		return getUserPreference(Meteor.userId(), 'hideUsernames') ? 'hide-usernames' : undefined;
	},
	checkboxData() {
		const instance = Template.instance() as ThreadTemplateInstance;
		const checked = instance.state.get('sendToChannel');
		return {
			id: 'sendAlso',
			checked,
			onChange: () => instance.state.set('sendToChannel', !checked),
		};
	},
});

Template.thread.onCreated(async function (this: ThreadTemplateInstance) {
	this.Threads = new Mongo.Collection(null) as Mongo.Collection<Omit<IMessage, '_id'>, IMessage> & {
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
			sendToChannel = !this.data.mainMessage.tcount;
	}

	const { mainMessage } = Template.currentData();

	this.state = new ReactiveDict(undefined, {
		sendToChannel,
		tmid: mainMessage._id,
		rid: mainMessage.rid,
	});

	this.loadMore = async () => {
		const { tmid } = Tracker.nonreactive(() => this.state.all());
		if (!tmid) {
			return;
		}

		this.state.set('loading', true);

		const messages = await callWithErrorHandling('getThreadMessages', { tmid });

		upsertMessageBulk({ msgs: messages }, this.Threads);

		Tracker.afterFlush(() => {
			this.state.set('loading', false);
		});
	};

	this.chatMessages = new ChatMessages({ rid: mainMessage.rid, tmid: mainMessage._id }, this.Threads);

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

	const wrapper = this.find('.js-scroll-thread');
	const input = this.find('.js-input-message') as HTMLTextAreaElement;

	this.chatMessages.initializeWrapper(wrapper);
	this.chatMessages.initializeInput(input);

	this.sendToBottom = _.throttle(() => {
		this.atBottom = true;
		wrapper.scrollTop = wrapper.scrollHeight;
	}, 300);

	this.sendToBottomIfNecessary = () => {
		this.atBottom && this.sendToBottom();
	};

	const list = this.firstNode.querySelector('.js-scroll-thread ul');

	if (!list) {
		throw new Error('Could not find list element');
	}

	const observer = new ResizeObserver(this.sendToBottomIfNecessary);
	observer.observe(list);

	this.onFile = (filesToUpload) => {
		const { input } = this.chatMessages;

		if (!input) {
			throw new Error('Could not find input element');
		}

		const rid = this.state.get('rid');

		if (!rid) {
			throw new Error('No rid found');
		}

		fileUpload(filesToUpload, input, {
			rid,
			tmid: this.state.get('tmid'),
		});
	};

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
			_.debounce((msg: IEditedMessage) => {
				if (Session.get('openedRoom') !== msg.rid || rid !== msg.rid || msg.editedAt || msg.tmid !== tmid) {
					return;
				}
				Meteor.call('readThreads', tmid);
			}, 1000),
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
		const rid = this.state.get('rid');
		const tmid = this.state.get('tmid');
		const input = this.find('.js-input-message') as HTMLTextAreaElement | null;
		if (!input) {
			throw new Error('Could not find input element');
		}

		this.chatMessages.initializeInput(input);

		setTimeout(() => {
			if (window.matchMedia('screen and (min-device-width: 500px)').matches) {
				input.focus();
			}
		}, 200);

		if (rid && tmid) {
			ChatMessages.set({ rid, tmid }, this.chatMessages);
		}
	});

	this.autorun(() => {
		FlowRouter.watchPathChange();
		const jump = FlowRouter.getQueryParam('jump');
		const { mainMessage } = Template.currentData();
		this.state.set({
			tmid: mainMessage._id,
			rid: mainMessage.rid,
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
});

Template.thread.onDestroyed(function (this: ThreadTemplateInstance) {
	const { Threads, threadsObserve, callbackRemove, state } = this;
	Threads.remove({});
	threadsObserve?.stop();

	callbackRemove?.();

	const tmid = state.get('tmid');
	const rid = state.get('rid');
	if (rid && tmid) {
		ChatMessages.delete({ rid, tmid });
	}
});
