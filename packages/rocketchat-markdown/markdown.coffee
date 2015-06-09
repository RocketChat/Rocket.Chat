###
# Process selected markdown in text messages
# @param {Object} message - The message object
###

class Markdown
	constructor: (message) ->
		msg = message.html

		# Process MD text for code ```
		msgParts = msg.split(/(```.*\n[\s\S]*?\n```)/)
		for part, index in msgParts
			# Verify if this part is code
			codeMatch = part.match(/```(.*)\n([\s\S]*?)\n```/)
			if codeMatch?
				# Process highlight if this part is code
				lang = codeMatch[1]
				code = codeMatch[2]
				if lang not in hljs.listLanguages()
					result = hljs.highlightAuto code
				else
					result = hljs.highlight lang, code
				msgParts[index] = "<pre><code class='hljs " + result.language + "'>" + result.value + "</code></pre>"
		msg = msgParts.join('')

		# Process MD text for strong, italic and strike
		msg = msg.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
		msg = msg.replace(/\_([^_]+)\_/g, '<i>$1</i>')
		msg = msg.replace(/\~([^_]+)\~/g, '<strike>$1</strike>')

		message.html = msg
		return message

RocketChat.callbacks.add 'beforeSaveMessage', Markdown
