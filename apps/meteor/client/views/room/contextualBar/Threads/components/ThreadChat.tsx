import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { isThreadMainMessage, isThreadMessage, isEditedMessage } from '@rocket.chat/core-typings';
import { CheckBox } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useMethod, useQueryStringParameter, useRoute, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import { ReactiveDict } from 'meteor/reactive-dict';
import type { ReactElement, RefCallback, UIEvent } from 'react';
import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';

import { Messages } from '../../../../../../app/models/client';
import { upsertMessageBulk } from '../../../../../../app/ui-utils/client/lib/RoomHistoryManager';
import type { CommonRoomTemplateInstance } from '../../../../../../app/ui/client/views/app/lib/CommonRoomTemplateInstance';
import { getCommonRoomEvents } from '../../../../../../app/ui/client/views/app/lib/getCommonRoomEvents';
import { callbacks } from '../../../../../../lib/callbacks';
import { isTruthy } from '../../../../../../lib/isTruthy';
import VerticalBar from '../../../../../components/VerticalBar';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import MessageHighlightContext from '../../../MessageList/contexts/MessageHighlightContext';
import DropTargetOverlay from '../../../components/body/DropTargetOverlay';
import LoadingMessagesIndicator from '../../../components/body/LoadingMessagesIndicator';
import ComposerContainer from '../../../components/body/composer/ComposerContainer';
import { useFileUploadDropTarget } from '../../../components/body/useFileUploadDropTarget';
import { useRoomMessageContext } from '../../../components/body/useRoomMessageContext';
import { useChat } from '../../../contexts/ChatContext';
import { MessageContext } from '../../../contexts/MessageContext';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { useTabBarClose, useToolboxContext } from '../../../contexts/ToolboxContext';

type ThreadChatProps = {
	mainMessage: IThreadMainMessage;
};

const ThreadChat = ({ mainMessage }: ThreadChatProps): ReactElement => {
	const t = useTranslation();
	const atBottomRef = useRef(true);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const messageContext = useContext(MessageContext);

	const chat = useChat();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const messageHighlightContext = useContext(MessageHighlightContext);

	const subscription = useRoomSubscription();

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget();

	const sendToChannelPreference = useUserPreference<'always' | 'never' | 'default'>('alsoSendThreadToChannel');

	const [sendToChannel, setSendToChannel] = useState(() => {
		switch (sendToChannelPreference) {
			case 'always':
				return true;
			case 'never':
				return false;
			default:
				return !mainMessage.tcount;
		}
	});
	const [loading, setLoading] = useState(false);

	const hideUsernames = useUserPreference<boolean>('hideUsernames');

	const handleSend = useCallback((): void => {
		if (sendToChannelPreference === 'default') {
			setSendToChannel(false);
		}
	}, [sendToChannelPreference]);

	const sendToBottom = useCallback(() => {
		const wrapper = wrapperRef.current;

		wrapper?.scrollTo(30, wrapper.scrollHeight);
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [sendToBottom]);

	const room = useRoom();
	const roomMessageContext = useRoomMessageContext(room);
	const threadMessageContext = useMemo(
		() => ({
			...roomMessageContext,
			settings: {
				...roomMessageContext.settings,
				showReplyButton: false,
				showreply: false,
			},
		}),
		[roomMessageContext],
	);

	const messages = useReactiveValue(
		useCallback(() => {
			return Messages.find(
				{
					$or: [{ tmid: mainMessage._id }, { _id: mainMessage._id }],
					_hidden: { $ne: true },
					tmid: mainMessage._id,
					_id: { $ne: mainMessage._id },
				},
				{
					fields: {
						collapsed: 0,
						threadMsg: 0,
						repliesCount: 0,
					},
					sort: { ts: 1 },
				},
			)
				.fetch()
				.filter(isThreadMessage);
		}, [mainMessage._id]),
	);

	const sendToChannelID = useUniqueId();

	const closeTabBar = useTabBarClose();
	const handleComposerEscape = useCallback((): void => {
		closeTabBar();
	}, [closeTabBar]);

	const handleNavigateToPreviousMessage = useCallback((): void => {
		chat.messageEditing.toPreviousMessage();
	}, [chat.messageEditing]);

	const handleNavigateToNextMessage = useCallback((): void => {
		chat.messageEditing.toNextMessage();
	}, [chat.messageEditing]);

	const handleUploadFiles = useCallback(
		(files: readonly File[]): void => {
			chat.flows.uploadFiles(files);
		},
		[chat],
	);

	const handleScroll = useCallback(({ currentTarget: e }: UIEvent) => {
		atBottomRef.current = e.scrollTop >= e.scrollHeight - e.clientHeight;
	}, []);

	const useLegacyMessageTemplate = useUserPreference<boolean>('useLegacyMessageTemplate') ?? false;
	const toolbox = useToolboxContext();

	useEffect(() => {
		const messageList = wrapperRef.current?.querySelector('ul');

		if (!messageList) {
			return;
		}

		const messageEvents: Record<string, (event: any, template: CommonRoomTemplateInstance) => void> = {
			...getCommonRoomEvents(useLegacyMessageTemplate),
			'click .toggle-hidden'(event: JQuery.ClickEvent) {
				const mid = event.target.dataset.message;
				if (mid) document.getElementById(mid)?.classList.toggle('message--ignored');
			},
			'load .gallery-item'() {
				sendToBottomIfNecessary();
			},
			'rendered .js-block-wrapper'() {
				sendToBottomIfNecessary();
			},
		};

		const eventHandlers = Object.entries(messageEvents).map(([key, handler]) => {
			const [, event, selector] = key.match(/^(.+?)\s(.+)$/) ?? [key, key];
			return {
				event,
				selector,
				listener: (e: JQuery.TriggeredEvent<HTMLUListElement, undefined>) =>
					handler.call(null, e, { data: { rid: room._id, tabBar: toolbox, chatContext: chat } }),
			};
		});

		for (const { event, selector, listener } of eventHandlers) {
			$(messageList).on(event, selector, listener);
		}

		return () => {
			for (const { event, selector, listener } of eventHandlers) {
				$(messageList).off(event, selector, listener);
			}
		};
	}, [chat, room._id, sendToBottomIfNecessary, toolbox, useLegacyMessageTemplate]);

	useEffect(() => {
		const messageList = wrapperRef.current?.querySelector('ul');

		if (!messageList) {
			return;
		}

		const observer = new ResizeObserver(() => {
			sendToBottomIfNecessary();
		});

		observer.observe(messageList);

		return () => {
			observer?.disconnect();
		};
	}, [sendToBottomIfNecessary]);

	const handleComposerResize = useCallback((): void => {
		sendToBottomIfNecessary();
	}, [sendToBottomIfNecessary]);

	const readThreads = useMethod('readThreads');

	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || (isEditedMessage(msg) && msg.editedAt) || msg.tmid !== mainMessage._id) {
					return;
				}

				readThreads(mainMessage._id);
			},
			callbacks.priority.MEDIUM,
			`thread-${room._id}`,
		);

		return () => {
			callbacks.remove('streamNewMessage', `thread-${room._id}`);
		};
	}, [mainMessage._id, readThreads, room._id, sendToBottom]);

	const jump = useQueryStringParameter('jump');
	const [currentRouteName, currentRouteParams, currentRouteQueryStringParams] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No route name');
	}
	const currentRoute = useRoute(currentRouteName);

	useEffect(() => {
		if (loading || !jump) {
			return;
		}

		const newQueryStringParams = { ...currentRouteQueryStringParams };
		delete newQueryStringParams.jump;
		currentRoute.replace(currentRouteParams, newQueryStringParams);

		const messageElement = document.querySelector(`#thread-${jump}`);
		if (!messageElement) {
			return;
		}

		messageElement.classList.add('highlight');
		const removeClass = () => {
			messageElement.classList.remove('highlight');
			messageElement.removeEventListener('animationend', removeClass);
		};
		messageElement.addEventListener('animationend', removeClass);
		setTimeout(() => {
			messageElement.scrollIntoView();
		}, 300);
	}, [currentRoute, currentRouteParams, currentRouteQueryStringParams, jump, loading]);

	const getThreadMessages = useMethod('getThreadMessages');

	useEffect(() => {
		setLoading(true);
		getThreadMessages({ tmid: mainMessage._id }).then((messages) => {
			upsertMessageBulk({ msgs: messages }, Messages);
			setLoading(false);
		});
	}, [getThreadMessages, mainMessage._id]);

	const [reactiveThreadMessageContext] = useState(
		() =>
			new ReactiveDict(undefined, {
				...threadMessageContext,
				'messageHighlightContext.highlightMessageId': messageHighlightContext.highlightMessageId,
				messageContext,
				'chatContext': chat,
			}),
	);
	useEffect(() => {
		reactiveThreadMessageContext.set({
			...threadMessageContext,
			'messageHighlightContext.highlightMessageId': messageHighlightContext.highlightMessageId,
			messageContext,
			'chatContext': chat,
		});
	}, [chat, messageContext, messageHighlightContext.highlightMessageId, reactiveThreadMessageContext, threadMessageContext]);

	const refs = useRef<Map<IMessage['_id'], { callback: RefCallback<HTMLLIElement>; reactiveMessage: ReactiveVar<IMessage> }>>(new Map());

	const getRef = useCallback(
		(message: IMessage, index: number) => {
			const pair = refs.current.get(message._id);

			if (pair) {
				pair.reactiveMessage.set(message);
				return pair.callback;
			}

			let view: Blaze.View;

			const reactiveMessage = new ReactiveVar(message);

			const callback = (node: HTMLLIElement | null) => {
				if (node?.parentElement) {
					view = Blaze.renderWithData(
						Template.message,
						() => {
							const message = reactiveMessage.get();

							return {
								index,
								msg: message,
								room: reactiveThreadMessageContext.get('room'),
								subscription: reactiveThreadMessageContext.get('subscription'),
								settings: reactiveThreadMessageContext.get('settings'),
								u: reactiveThreadMessageContext.get('u'),
								chatContext: reactiveThreadMessageContext.get('chatContext'),
								messageContext: reactiveThreadMessageContext.get('messageContext'),
								hideRoles: true,
								shouldCollapseReplies: true,
								templatePrefix: 'thread-',

								context: 'threads',
								...(isThreadMainMessage(message)
									? {
											customClass: [
												'thread-main',
												message._id === reactiveThreadMessageContext.get('messageHighlightContext.highlightMessageId') ? 'editing' : '',
											]
												.filter(Boolean)
												.join(' '),
											ignored: false,
											groupable: false,
									  }
									: {
											customClass:
												message._id === reactiveThreadMessageContext.get('messageHighlightContext.highlightMessageId') ? 'editing' : '',
											context: 'threads',
									  }),
							};
						},
						node.parentElement,
						node,
					);
				}

				if (!node) {
					Blaze.remove(view);
				}
			};

			refs.current.set(message._id, { callback, reactiveMessage });

			return callback;
		},
		[reactiveThreadMessageContext],
	);

	return (
		<VerticalBar.Content flexShrink={1} flexGrow={1} paddingInline={0} {...fileUploadTriggerProps}>
			<DropTargetOverlay {...fileUploadOverlayProps} />
			<section className={['contextual-bar__content flex-tab threads', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}>
				<div ref={wrapperRef} className='thread-list js-scroll-thread' style={{ scrollBehavior: 'smooth' }} onScroll={handleScroll}>
					<ul className='thread'>
						{loading ? (
							<li className='load-more'>
								<LoadingMessagesIndicator />
							</li>
						) : (
							<>
								<li key={mainMessage._id} ref={getRef(mainMessage, -1)} />
								{messages.map((message, index) => (
									<li key={message._id} ref={getRef(message, index)} />
								))}
							</>
						)}
					</ul>
				</div>
				<ComposerContainer
					rid={mainMessage.rid}
					subscription={subscription}
					chatMessagesInstance={chat}
					onSend={handleSend}
					onEscape={handleComposerEscape}
					onResize={handleComposerResize}
					onNavigateToPreviousMessage={handleNavigateToPreviousMessage}
					onNavigateToNextMessage={handleNavigateToNextMessage}
					onUploadFiles={handleUploadFiles}
				/>
				<footer className='thread-footer'>
					<div style={{ display: 'flex' }}>
						<CheckBox id={sendToChannelID} checked={sendToChannel} onChange={() => setSendToChannel((checked) => !checked)} />
					</div>
					<label htmlFor={sendToChannelID} className='thread-footer__text'>
						{t('Also_send_to_channel')}
					</label>
				</footer>
			</section>
		</VerticalBar.Content>
	);
};

export default ThreadChat;
