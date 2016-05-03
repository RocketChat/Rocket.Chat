###
# Highlight is a named function that will highlight ``` messages
# @param {Object} message - The message object
###

class Highlight

	constructor: (message) ->

		if s.trim message.html
			message.tokens ?= []

			# Count occurencies of ```
			count = (message.html.match(/```/g) || []).length

			if count

				# Check if we need to add a final ```
				if (count % 2 > 0)
					message.html = message.html + "\n```"
					message.msg = message.msg + "\n```"

				# Separate text in code blocks and non code blocks
				msgParts = message.html.split(/(```\w*[\n\ ]?[\s\S]*?```+?)$/)

				for part, index in msgParts
					# Verify if this part is code
					codeMatch = part.match(/```(\w*)[\n\ ]?([\s\S]*?)```+?$/)
					if codeMatch?
						# Process highlight if this part is code
						singleLine = codeMatch[0].indexOf('\n') is -1

						if singleLine
							lang = ''
							code = _.unescapeHTML codeMatch[1] + ' ' + codeMatch[2]
						else
							lang = codeMatch[1]
							code = _.unescapeHTML codeMatch[2]

						if lang not in hljs.listLanguages()
							result = hljs.highlightAuto (lang + ' ' + code)
						else
							result = hljs.highlight lang, code

						token = "=&=#{Random.id()}=&="

						message.tokens.push
							highlight: true
							token: token
							text: "<pre><code class='hljs " + result.language + "'><span class='copyonly'>```<br></span>" + result.value + "<span class='copyonly'><br>```</span></code></pre>"

						msgParts[index] = token
					else
						msgParts[index] = part

				# Re-mount message
				message.html = msgParts.join('')

		return message

RocketChat.callbacks.add 'renderMessage', Highlight, RocketChat.callbacks.priority.HIGH
RocketChat.Highlight = true
