import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import React, { memo, ReactElement, useCallback, useEffect, useRef } from 'react';

import { RoomManager } from '../../../../../../app/ui-utils/client';
import { ChatMessages } from '../../../../../../app/ui/client';
import { useEmbeddedLayout } from '../../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../../Room/ComposerSkeleton';

export type ComposerMessageProps = {
	rid: IRoom['_id'];
	subscription?: ISubscription;
	chatMessagesInstance: ChatMessages;
	onResize?: () => void;
};

const ComposerMessage = ({ rid, subscription, chatMessagesInstance, onResize }: ComposerMessageProps): ReactElement => {
	const isLayoutEmbedded = useEmbeddedLayout();
	const showFormattingTips = useSetting('Message_ShowFormattingTips') as boolean;

	const messageBoxViewRef = useRef<Blaze.View>();
	const messageBoxViewDataRef = useRef(
		new ReactiveVar({
			rid,
			subscription,
			isEmbedded: isLayoutEmbedded,
			showFormattingTips: showFormattingTips && !isLayoutEmbedded,
			onResize,
			chatMessagesInstance,
		}),
	);

	useEffect(() => {
		messageBoxViewDataRef.current.set({
			rid,
			subscription,
			isEmbedded: isLayoutEmbedded,
			showFormattingTips: showFormattingTips && !isLayoutEmbedded,
			onResize,
			chatMessagesInstance,
		});
	}, [isLayoutEmbedded, onResize, rid, showFormattingTips, subscription, chatMessagesInstance]);

	const footerRef = useCallback(
		(footer: HTMLElement | null) => {
			if (footer) {
				messageBoxViewRef.current = Blaze.renderWithData(
					Template.messageBox,
					() => ({
						...messageBoxViewDataRef.current.get(),
						onInputChanged: (input: HTMLTextAreaElement): void => {
							chatMessagesInstance.initializeInput(input);

							setTimeout(() => {
								if (window.matchMedia('screen and (min-device-width: 500px)').matches) {
									input.focus();
								}
							}, 200);
						},
						onKeyDown: (event: KeyboardEvent) => chatMessagesInstance.keydown(event),
						onSend: (
							_event: Event,
							params: {
								value: string;
								tshow?: boolean;
							},
						) => chatMessagesInstance.send(params),
					}),
					footer,
				);
				return;
			}

			if (messageBoxViewRef.current) {
				Blaze.remove(messageBoxViewRef.current);
				messageBoxViewRef.current = undefined;
			}
		},
		[chatMessagesInstance],
	);

	const publicationReady = useReactiveValue(useCallback(() => RoomManager.getOpenedRoomByRid(rid)?.streamActive ?? false, [rid]));

	if (!publicationReady) {
		return (
			<footer className='footer'>
				<ComposerSkeleton />
			</footer>
		);
	}

	return <footer ref={footerRef} className='footer' />;
};

export default memo(ComposerMessage);
