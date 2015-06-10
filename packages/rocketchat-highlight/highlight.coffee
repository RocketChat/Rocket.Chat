###
# Highlight is a named function that will highlight ``` messages
# @param {Object} message - The message object
###

class Highlight
	
	# If message starts with ```, replace it for text formatting
	constructor: (message) ->

		if _.trim message.html
			# Separate text in code blocks and non code blocks
			msgParts = message.html.split(/(```.*\n[\s\S]*?\n```)/)

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
				else
					# Escape html and fix line breaks for non code blocks
					part = _.escapeHTML part
					part = part.replace /\n/g, '<br/>'
					msgParts[index] = part

			# Re-mount message
			message.html = msgParts.join('')

		return message

RocketChat.callbacks.add 'renderMessage', Highlight, RocketChat.callbacks.priority.HIGH