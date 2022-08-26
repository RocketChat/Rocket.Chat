import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { memo, ReactElement, useCallback, useRef } from 'react';

import { chatMessages } from '../../../../../app/ui';
import { RoomManager } from '../../../../../app/ui-utils/client';
import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../Room/ComposerSkeleton';

type ComposerContainerProps = {
	rid: IRoom['_id'];
	subscription?: ISubscription;
	sendToBottomIfNecessary?: () => void;
};

const ComposerContainer = ({ rid, subscription, sendToBottomIfNecessary }: ComposerContainerProps): ReactElement => {
	const messageBoxViewRef = useRef<Blaze.View>();
	const isLayoutEmbedded = useEmbeddedLayout();
	const showFormattingTips = useSetting('Message_ShowFormattingTips') as boolean;

	const footerRef = useCallback(
		(footer: HTMLElement | null) => {
			if (footer) {
				messageBoxViewRef.current = Blaze.renderWithData(
					Template.messageBox,
					() => ({
						rid,
						subscription,
						isEmbedded: isLayoutEmbedded,
						showFormattingTips: showFormattingTips && !isLayoutEmbedded,
						onInputChanged: (input: HTMLTextAreaElement): void => {
							chatMessages[rid]?.initializeInput(input, { rid });
						},
						onResize: () => sendToBottomIfNecessary?.(),
						onKeyUp: (
							event: KeyboardEvent,
							{
								rid,
								tmid,
							}: {
								rid: string;
								tmid?: string | undefined;
							},
						) => chatMessages[rid]?.keyup(event, { rid, tmid }),
						onKeyDown: (event: KeyboardEvent) => chatMessages[rid]?.keydown(event),
						onSend: (
							event: Event,
							params: {
								rid: string;
								tmid?: string;
								value: string;
								tshow?: boolean;
							},
							done?: () => void,
						) => chatMessages[rid]?.send(event, params, done),
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
		[isLayoutEmbedded, rid, sendToBottomIfNecessary, showFormattingTips, subscription],
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
