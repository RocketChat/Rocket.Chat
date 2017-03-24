/*
 * Spotify a named function that will process Spotify links or syntaxes (ex: spotify:track:1q6IK1l4qpYykOaWaLJkWG)
 * @param {Object} message - The message object
 */

const process = function(message, source, callback) {
	if (_.trim(source)) {
		// Separate text in code blocks and non code blocks
		const msgParts = source.split(/(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/);

		for (let index = 0; index < msgParts.length; index++) {
			// Verify if this part is code
			const part = msgParts[index];

			if (((part != null ? part.length > 0 : undefined) != null)) {
				const codeMatch = part.match(/(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/);
				if (codeMatch == null) {
					callback(message, msgParts, index, part);
				}
			}
		}
	}
};
class Spotify {
	static transform(message) {
		let urls = [];
		if (Array.isArray(message.urls)) {
			urls = urls.concat(message.urls);
		}

		let changed = false;

		process(message, message.msg, function(message, msgParts, index, part) {
			const re = /(?:^|\s)spotify:([^:\s]+):([^:\s]+)(?::([^:\s]+))?(?::(\S+))?(?:\s|$)/g;

			let match;
			while ((match = re.exec(part))) {
				const data = _.filter(match.slice(1), value => value != null);
				const path = _.map(data, value => _.escape(value)).join('/');
				const url = `https://open.spotify.com/${ path }`;
				urls.push({url, 'source': `spotify:${ data.join(':') }`});
				changed = true;
			}

		});

		// Re-mount message
		if (changed) {
			message.urls = urls;
		}

		return message;
	}

	static render(message) {
		process(message, message.html, function(message, msgParts, index, part) {
			if (Array.isArray(message.urls)) {
				for (const item of Array.from(message.urls)) {
					if (item.source) {
						const quotedSource = item.source.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
						const re = new RegExp(`(^|\\s)${ quotedSource }(\\s|$)`, 'g');
						msgParts[index] = part.replace(re, `$1<a href="${ item.url }" target="_blank">${ item.source }</a>$2`);
					}
				}
				return message.html = msgParts.join('');
			}
		});

		return message;
	}
}

RocketChat.callbacks.add('beforeSaveMessage', Spotify.transform, RocketChat.callbacks.priority.LOW, 'spotify-save');
RocketChat.callbacks.add('renderMessage', Spotify.render, RocketChat.callbacks.priority.MEDIUM, 'spotify-render');
RocketChat.Spotify = Spotify;
