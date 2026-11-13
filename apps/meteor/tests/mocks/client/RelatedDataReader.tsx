import type { IMessage } from '@rocket.chat/core-typings';
import type { MessageConversation, MessageRelatedDataContextValue } from '@rocket.chat/ui-message-list';
import { useMessageRelatedData } from '@rocket.chat/ui-message-list';
import { memo } from 'react';

export type RelatedDataReads = Record<string, (relatedData: MessageRelatedDataContextValue, message: IMessage) => string>;

const isBroadcast = ({ subscription }: MessageConversation) => subscription?.broadcast ?? false;

const useReadCollapsed = ({ useCollapsedState }: MessageRelatedDataContextValue) =>
	`collapsed: ${useCollapsedState('collapsible', false)[0]}`;

const useReadRoles = ({ usePlaceUserRoles }: MessageRelatedDataContextValue, message: IMessage) =>
	`roles: ${usePlaceUserRoles(message.u._id, message.rid)?.roomRoles.join(',') ?? 'none'}`;

const useReadBroadcast = ({ useConversation }: MessageRelatedDataContextValue, message: IMessage) =>
	`broadcast: ${useConversation(message, { enabled: true, select: isBroadcast }).data}`;

const useReadConversation = ({ useConversation }: MessageRelatedDataContextValue, message: IMessage) =>
	`topic: ${useConversation(message, { enabled: true }).data?.room?.topic ?? 'no topic'}`;

/** One of each kind of read a message row makes of the related data; each is a stable function, so a reader renders only for what it reads. */
export const relatedDataReads = {
	collapsed: useReadCollapsed,
	roles: useReadRoles,
	broadcast: useReadBroadcast,
	conversation: useReadConversation,
} satisfies RelatedDataReads;

type RelatedDataReaderProps = {
	message: IMessage;
	read: RelatedDataReads[string];
	/** Counts how many times this reader rendered, and what it showed each time. */
	onRender: (shown: string) => void;
};

/**
 * Reads related data as a message row does and shows what it read. It is memoized, as the rows of a list are, so it renders again
 * only when what it reads changes.
 */
const RelatedDataReader = memo(function RelatedDataReader({ message, read, onRender }: RelatedDataReaderProps) {
	const shown = read(useMessageRelatedData(), message);
	onRender(shown);
	return <span>{shown}</span>;
});

export default RelatedDataReader;
