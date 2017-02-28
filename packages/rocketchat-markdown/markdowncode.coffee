###
# MarkdownCode is a named function that will parse `inline code` and ```codeblock``` syntaxes
# @param {Object} message - The message object
###
import hljs from 'highlight.js';

class MarkdownCode
	constructor: (message) ->

		if s.trim message.html
			message.tokens ?= []

			MarkdownCode.handle_codeblocks message
			MarkdownCode.handle_inlinecode message

			console.log 'Markdown', message if window?.rocketDebug

		return message

	@handle_inlinecode: (message) ->
		# Support `text`
		message.html = message.html.replace /(^|&gt;|[ >_*~])\`([^`\r\n]+)\`([<_*~]|\B|\b|$)/gm, (match, p1, p2, p3, offset, text) ->
			token = "=&=#{Random.id()}=&="

			message.tokens.push
				token: token
				text: "#{p1}<span class=\"copyonly\">`</span><span><code class=\"code-colors inline\">#{p2}</code></span><span class=\"copyonly\">`</span>#{p3}"

			return token


	@handle_codeblocks: (message) ->
		# Count occurencies of ```
		count = (message.html.match(/```/g) || []).length

		if count

			# Check if we need to add a final ```
			if (count % 2 > 0)
				message.html = message.html + "\n```"
				message.msg = message.msg + "\n```"

			# Separate text in code blocks and non code blocks
			msgParts = message.html.split(/^\s*(```(?:[a-zA-Z]+)?(?:(?:.|\n)*?)```)(?:\n)?$/gm)

			for part, index in msgParts
				# Verify if this part is code
				codeMatch = part.match(/^```(\w*[\n\ ]?)([\s\S]*?)```+?$/)

				if codeMatch?
					# Process highlight if this part is code
					singleLine = codeMatch[0].indexOf('\n') is -1

					if singleLine
						lang = ''
						code = _.unescapeHTML codeMatch[1] + codeMatch[2]
					else
						lang = codeMatch[1]
						code = _.unescapeHTML codeMatch[2]

					if s.trim(lang) is ''
						lang = ''

					if s.trim(lang) not in hljs.listLanguages()
						result = hljs.highlightAuto (lang + code)
					else
						result = hljs.highlight s.trim(lang), code

					token = "=&=#{Random.id()}=&="

					message.tokens.push
						highlight: true
						token: token
						text: "<pre><code class='code-colors hljs " + result.language + "'><span class='copyonly'>```<br></span>" + result.value + "<span class='copyonly'><br>```</span></code></pre>"

					msgParts[index] = token
				else
					msgParts[index] = part

			# Re-mount message
			message.html = msgParts.join('')

RocketChat.MarkdownCode = MarkdownCode

# MarkdownCode gets higher priority over Markdown so it's possible place a callback in between (katex for exmaple)
RocketChat.callbacks.add 'renderMessage', MarkdownCode, RocketChat.callbacks.priority.HIGH - 2, 'markdowncode'
