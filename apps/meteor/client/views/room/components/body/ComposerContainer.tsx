import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import React, { memo, ReactElement, useCallback, useEffect, useRef } from 'react';

import { ChatMessages } from '../../../../../app/ui';
import { RoomManager } from '../../../../../app/ui-utils/client';
import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../Room/ComposerSkeleton';

type ComposerContainerProps = {
	rid: IRoom['_id'];
	subscription?: ISubscription;
	chatMessagesInstance: ChatMessages;
	onResize?: () => void;
};

const ComposerContainer = ({ rid, subscription, chatMessagesInstance, onResize }: ComposerContainerProps): ReactElement => {
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
		}),
	);

	useEffect(() => {
		messageBoxViewDataRef.current.set({
			rid,
			subscription,
			isEmbedded: isLayoutEmbedded,
			showFormattingTips: showFormattingTips && !isLayoutEmbedded,
			onResize,
		});
	}, [isLayoutEmbedded, onResize, rid, showFormattingTips, subscription]);

	const footerRef = useCallback(
		(footer: HTMLElement | null) => {
			if (footer) {
				messageBoxViewRef.current = Blaze.renderWithData(
					Template.messageBox,
					() => ({
						...messageBoxViewDataRef.current.get(),
						onInputChanged: (input: HTMLTextAreaElement): void => {
							chatMessagesInstance.initializeInput(input, { rid });
						},
						onKeyUp: (
							event: KeyboardEvent,
							{
								rid,
								tmid,
							}: {
								rid: string;
								tmid?: string | undefined;
							},
						) => chatMessagesInstance.keyup(event, { rid, tmid }),
						onKeyDown: (event: KeyboardEvent) => chatMessagesInstance.keydown(event),
						onSend: (
							event: Event,
							params: {
								rid: string;
								tmid?: string;
								value: string;
								tshow?: boolean;
							},
							done?: () => void,
						) => chatMessagesInstance.send(event, params, done),
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
		[rid, chatMessagesInstance],
	);

	const subscriptionReady = useReactiveValue(useCallback(() => RoomManager.getOpenedRoomByRid(rid)?.streamActive ?? false, [rid]));

	if (!subscriptionReady) {
		return (
			<footer className='footer'>
				<ComposerSkeleton />
			</footer>
		);
	}

	return <footer ref={footerRef} className='footer' />;
};

export default memo(ComposerContainer);
