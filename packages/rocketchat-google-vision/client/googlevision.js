RocketChat.GoogleVision = {
	getVisionAttributes(attachment) {
		const attributes = {};
		const labels = [];
		if (attachment.labels && attachment.labels.length > 0) {
			attachment.labels.forEach(label => {
				labels.push({ label });
			});
		}
		if (attachment.safeSearch && attachment.safeSearch && attachment.safeSearch.adult === true) {
			labels.push({ label: 'NSFW', bgColor: 'red', fontColor: 'white' });
		}
		if (attachment.safeSearch && attachment.safeSearch.violence === true) {
			labels.push({ label: 'Violence', bgColor: 'red', fontColor: 'white' });
		}
		if (attachment.colors && attachment.colors.length > 0) {
			attributes.color = `#${ attachment.colors[0] }`;
		}
		if (attachment.logos && attachment.logos.length > 0) {
			labels.push({ label: `Logo: ${ attachment.logos[0] }` });
		}
		if (attachment.faces && attachment.faces.length > 0) {
			let faceCount = 0;
			attachment.faces.forEach(face => {
				const faceAttributes = [];
				if (face.joy) {
					faceAttributes.push('Joy');
				}
				if (face.sorrow) {
					faceAttributes.push('Sorrow');
				}
				if (face.anger) {
					faceAttributes.push('Anger');
				}
				if (face.surprise) {
					faceAttributes.push('Surprise');
				}
				if (faceAttributes.length > 0) {
					labels.push({ label: `Face ${ ++faceCount }: ${ faceAttributes.join(', ') }` });
				}
			});
		}
		if (labels.length > 0) {
			attributes.labels = labels;
		}
		return attributes;
	},

	init() {
		Tracker.autorun(() => {
			if (RocketChat.settings.get('GoogleVision_Enable')) {
				RocketChat.callbacks.add('renderMessage', (message) => {
					if (message.attachments && message.attachments.length > 0) {
						for (const index in message.attachments) {
							if (message.attachments.hasOwnProperty(index)) {
								const attachment = message.attachments[index];
								message.attachments[index] = Object.assign(message.attachments[index], this.getVisionAttributes(attachment));
							}
						}
					}
					return message;
				}, RocketChat.callbacks.priority.HIGH - 3, 'googlevision');

				RocketChat.callbacks.add('streamMessage', (message) => {
					if (message.attachments && message.attachments.length > 0) {
						for (const index in message.attachments) {
							if (message.attachments.hasOwnProperty(index)) {
								const attachment = message.attachments[index];
								message.attachments[index] = Object.assign(message.attachments[index], this.getVisionAttributes(attachment));
							}
						}
					}
				}, RocketChat.callbacks.priority.HIGH - 3, 'googlevision-stream');
			} else {
				RocketChat.callbacks.remove('renderMessage', 'googlevision');
				RocketChat.callbacks.remove('streamMessage', 'googlevision-stream');
			}
		});
	}
};

Meteor.startup(function() {
	RocketChat.GoogleVision.init();
});
