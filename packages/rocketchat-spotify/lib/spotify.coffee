###
# Spotify a named function that will process Spotify links or syntaxes (ex: spotify:track:1q6IK1l4qpYykOaWaLJkWG)
# @param {Object} message - The message object
###

class Spotify
	process = (message, source, callback) ->
		if _.trim source
			# Separate text in code blocks and non code blocks
			msgParts = source.split /(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/

			for part, index in msgParts
				# Verify if this part is code
				if part?.length? > 0
					codeMatch = part.match /(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/
					if not codeMatch?
						callback message, msgParts, index, part

	@transform: (message) ->
		urls = []
		if Array.isArray message.urls
			urls = urls.concat message.urls

		changed = false

		process message, message.msg, (message, msgParts, index, part) ->
			re = /(?:^|\s)spotify:([^:\s]+):([^:\s]+)(?::([^:\s]+))?(?::(\S+))?(?:\s|$)/g
			while match = re.exec(part)
				data = _.filter match.slice(1), (value) ->
					return value?
				path = _.map data, (value) ->
					return _.escape(value)
				.join '/'
				url = 'https://open.spotify.com/' + path
				urls.push {'url': url, 'source': 'spotify:' + data.join ':'}
				changed = true

		# Re-mount message
		if changed
			message.urls = urls

		return message

	@render: (message) ->
		process message, message.html, (message, msgParts, index, part) ->
			if Array.isArray message.urls
				for item in message.urls
					if item.source
						quotedSource = item.source.replace /[\\^$.*+?()[\]{}|]/g, '\\$&'
						re = new RegExp '(^|\\s)' + quotedSource + '(\\s|$)', 'g'
						msgParts[index] = part.replace re, '$1<a href="' + item.url + '" target="_blank">' + item.source + '</a>$2'
				message.html = msgParts.join ''

		return message

RocketChat.callbacks.add 'beforeSaveMessage', Spotify.transform, RocketChat.callbacks.priority.LOW, 'spotify-save'
RocketChat.callbacks.add 'renderMessage', Spotify.render, RocketChat.callbacks.priority.MEDIUM, 'spotify-render'
RocketChat.Spotify = Spotify
