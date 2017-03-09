RocketChat.GoogleVision = {
	getVisionAttributes(googleVision) {
		const attributes = {};
		const labels = [];
		if (googleVision.labels && googleVision.labels.length > 0) {
			googleVision.labels.forEach(label => {
				labels.push({ label });
			});
		}
		if (googleVision.safeSearch && googleVision.safeSearch.adult === true) {
			if (RocketChat.settings.get('GoogleVision_Block_Adult_Images')) {
				attributes.title_link = attributes.image_url = 'http://farm3.static.flickr.com/2726/4156187118_79cf2afb81_o.jpg';
			}
			labels.push({ label: 'NSFW', bgColor: 'red', fontColor: 'white' });
		}
		if (googleVision.safeSearch && googleVision.safeSearch.violence === true) {
			labels.push({ label: 'Violence', bgColor: 'red', fontColor: 'white' });
		}
		if (googleVision.properties && googleVision.properties.colors && googleVision.properties.colors.length > 0) {
			attributes.color = '#' + googleVision.properties.colors[0];
		}
		if (googleVision.logos && googleVision.logos.length > 0) {
			labels.push({ label: `Logo: ${googleVision.logos[0]}` });
		}
		if (googleVision.faces && googleVision.faces.length > 0) {
			let faceCount = 0;
			googleVision.faces.forEach(face => {
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
					labels.push({ label: `Face ${++faceCount}: ${faceAttributes.join(', ')}` });
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
								if (attachment.googleVision) {
									message.attachments[index] = Object.assign(message.attachments[index], this.getVisionAttributes(attachment.googleVision));
								}
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
								if (attachment.googleVision) {
									message.attachments[index] = Object.assign(message.attachments[index], this.getVisionAttributes(attachment.googleVision));
								}
							}
						}
					}
					RocketChat.models.Message.update({ _id: message._id }, { $set: { attachments: message.attachments } });
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
