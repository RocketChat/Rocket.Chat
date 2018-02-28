const validateBodyAttachments = (attachments) => {

	const validateAttachmentsFields = (attachmentFields) => {
		check(attachmentFields, Match.ObjectIncluding({
			short: Match.Maybe(Boolean),
			title: String,
			value: String
		}));
	};

	const validateAttachment = (attachment) => {
		check(attachment, Match.ObjectIncluding({
			color: Match.Maybe(String),
			text: Match.Maybe(String),
			ts: Match.Maybe(String),
			thumb_url: Match.Maybe(String),
			message_link: Match.Maybe(String),
			collapsed: Match.Maybe(Boolean),
			author_name: Match.Maybe(String),
			author_link: Match.Maybe(String),
			author_icon: Match.Maybe(String),
			title: Match.Maybe(String),
			title_link: Match.Maybe(String),
			title_link_download: Match.Maybe(Boolean),
			image_url: Match.Maybe(String),
			audio_url: Match.Maybe(String),
			video_url: Match.Maybe(String)
		}));

		if (attachment.fields.length) {
			attachment.fields.map(validateAttachmentsFields);
		}
	};

	attachments.map(validateAttachment);
};

export const validateMessageObject = ({ message, method }) => {
	const hasAtLeastOneOfRequiredParamsForPostMessage = Boolean(message.roomId) || Boolean(message.channel);
	const hasAtLeastOneOfRequiredParamsForSendMessage = Boolean(message.rid);

	if (method === 'postMessage' && !hasAtLeastOneOfRequiredParamsForPostMessage) {
		throw new Error('At least one, \'roomId\' or \'channel\' should be provided');
	}

	if (method === 'sendMessage' && !hasAtLeastOneOfRequiredParamsForSendMessage) {
		throw new Error('The \'rid\' param, must be provided');
	}

	try {
		check(message, Match.ObjectIncluding({
			roomId: Match.Maybe(String),
			channel: Match.Maybe(String),
			text: Match.Maybe(String),
			alias: Match.Maybe(String),
			emoji: Match.Maybe(String),
			avatar: Match.Maybe(String),
			attachments: Match.Maybe(Array)
		}));

		if (Array.isArray(message.attachments) && message.attachments.length) {
			validateBodyAttachments(message.attachments);
		}
	} catch (error) {
		throw error;
	}

};
