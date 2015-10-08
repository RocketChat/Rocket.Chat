###
# Markdown is a named function that will parse markdown syntax
# @param {Object} message - The message object
###

class Markdown
	constructor: (message) ->

		if _s.trim message.html

			msg = message.html

			# Process MD like for strong, italic and strike
			msg = msg.replace(/(^|&gt;|[ >_*~])\`([^`]+)\`([<_*~]|\B|\b|$)/gm, '$1<span class="copyonly">`</span><code class="inline">$2</code><span class="copyonly">`</span>$3')
			msg = msg.replace(/(^|&gt;|[ >_~`])\*([^*]+)\*([<_~`]|\B|\b|$)/gm, '$1<span class="copyonly">*</span><strong>$2</strong><span class="copyonly">*</span>$3')
			msg = msg.replace(/(^|&gt;|[ >*~`])\_([^_]+)\_([<*~`]|\B|\b|$)/gm, '$1<span class="copyonly">_</span><em>$2</em><span class="copyonly">_</span>$3')
			msg = msg.replace(/(^|&gt;|[ >_*`])\~{1,2}([^~]+)\~{1,2}([<_*`]|\B|\b|$)/gm, '$1<span class="copyonly">~</span><strike>$2</strike><span class="copyonly">~</span>$3')
			msg = msg.replace(/^&gt;(.*)$/gm, '<blockquote><span class="copyonly">&gt;</span>$1</blockquote>')
			msg = msg.replace(/<\/blockquote>\n<blockquote>/gm, '</blockquote><blockquote>')

			message.html = msg

			console.log 'Markdown', message if window?.rocketDebug

		return message

RocketChat.callbacks.add 'renderMessage', Markdown, RocketChat.callbacks.priority.LOW
RocketChat.Markdown = Markdown
