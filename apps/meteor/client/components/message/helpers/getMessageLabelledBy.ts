/**
 * Names a message row after its author and time when it starts a group, then its text, and its read status when read
 * receipts are on, so moving between messages reads what the message says instead of every element inside it.
 */
export const getMessageLabelledBy = ({
	messageId,
	sequential = false,
	readReceiptEnabled = false,
}: {
	messageId: string;
	sequential?: boolean;
	readReceiptEnabled?: boolean;
}): string => {
	const labels: string[] = [];

	if (!sequential) {
		labels.push(`${messageId}-displayName`, `${messageId}-time`);
	}

	labels.push(`${messageId}-content`);

	if (readReceiptEnabled) {
		labels.push(`${messageId}-read-status`);
	}

	return labels.join(' ');
};
