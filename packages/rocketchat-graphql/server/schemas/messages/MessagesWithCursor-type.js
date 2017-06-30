export const schema = `
	type MessagesWithCursor {
		cursor: String
		channel: Channel
		messagesArray: [Message]
	}
`;
