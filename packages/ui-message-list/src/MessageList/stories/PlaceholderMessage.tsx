import type { IMessage } from '@rocket.chat/core-typings';
import {
	Message,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageNameContainer,
	MessageTimestamp,
} from '@rocket.chat/fuselage';
import { useId } from 'react';

import LateContent from './LateContent';
import { useIsMessageHighlighted } from '../MessageRowStateContext';

export type PlaceholderMessageProps = {
	message: IMessage;
	isSequential: boolean;
};

/**
 * A minimal message, enough to exercise the list: author, time and text, plus late-resizing content on demand.
 */
const PlaceholderMessage = ({ message, isSequential }: PlaceholderMessageProps) => {
	const isHighlighted = useIsMessageHighlighted(message._id);
	const nameId = useId();
	const late = message.customFields?.lateContent as { height: number; delay: number } | undefined;

	return (
		<Message
			role='listitem'
			aria-roledescription='message'
			aria-labelledby={nameId}
			tabIndex={0}
			sequential={isSequential}
			isEditing={isHighlighted}
			isPending={message.temp}
			data-qa-message-id={message._id}
		>
			<MessageLeftContainer />
			<MessageContainer>
				{!isSequential && (
					<MessageHeader>
						<MessageNameContainer>
							<MessageName id={nameId}>{message.u.name ?? message.u.username}</MessageName>
						</MessageNameContainer>
						<MessageTimestamp title={message.ts.toISOString()}>{message.ts.toISOString().slice(11, 16)}</MessageTimestamp>
					</MessageHeader>
				)}
				<MessageBody id={isSequential ? nameId : undefined}>{message.msg}</MessageBody>
				{late && <LateContent height={late.height} delay={late.delay} />}
			</MessageContainer>
		</Message>
	);
};

export default PlaceholderMessage;
