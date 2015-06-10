###
# Markdown is a named function that will parse markdown syntax
# @param {Object} message - The message object
###

class Markdown
	constructor: (message) ->

		msg = message.html or ''

		# Process MD like for strong, italic and strike
		msg = msg.replace(/(\ |^)\*([^*]+)\*(\ |$)/gm, '$1<strong>$2</strong>$3')
		msg = msg.replace(/(\ |^)\_([^_]+)\_(\ |$)/gm, '$1<em>$2</em>$3')
		msg = msg.replace(/(\ |^)\`([^`]+)\`(\ |$)/gm, '$1<code class="inline">$2</code>$3')
		msg = msg.replace(/(\ |^)\~{1,2}([^~]+)\~{1,2}(\ |$)/gm, '$1<strike>$2</strike>$3')

		message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', Markdown, RocketChat.callbacks.priority.LOW
