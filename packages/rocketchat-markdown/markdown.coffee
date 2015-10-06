###
# Markdown is a named function that will parse markdown syntax
# @param {Object} message - The message object
###
##if Meteor.isClient isnt true
##	showdown = Npm.require('showdown')

class Markdown
	constructor: (message) ->

		if _.trim message.html

			msg = message.html

			# Support ![alt text](http://image url)
			msg = msg.replace(/!\[(.*)\]\((https?:\/\/([\da-z\.-]+)([\/\w \.-]*)*\/?)\)/gm, '<a href="$2" title="$1" class="swipebox" target="_blank">
				<div style="background-image: url($2); background-size: contain; background-repeat: no-repeat; background-position: center left; max-height: 200px;"></div>
			</a>')

			# Support [Text](http://link)
			msg = msg.replace(/\[([\d\w\.-_] ?)+\]\((https?:\/\/([\da-z\.-]+)([\/\w \.-]*)*\/?)\)/gm, '<a href="$2">$1</a>')

			# Support `text`
			msg = msg.replace(/(^|&gt;|[ >_*~])\`([^`]+)\`([<_*~]|\B|\b|$)/gm, '$1<span class="copyonly">`</span><code class="inline">$2</code><span class="copyonly">`</span>$3')

			# Support *text* to make bold
			msg = msg.replace(/(^|&gt;|[ >_~`])\*([^*]+)\*([<_~`]|\B|\b|$)/gm, '$1<span class="copyonly">*</span><strong>$2</strong><span class="copyonly">*</span>$3')

			# Support _text_ to make italics
			msg = msg.replace(/(^|&gt;|[ >*~`])\_([^_]+)\_([<*~`]|\B|\b|$)/gm, '$1<span class="copyonly">_</span><em>$2</em><span class="copyonly">_</span>$3')

			# Support ~text~ to strike through text
			msg = msg.replace(/(^|&gt;|[ >_*`])\~{1,2}([^~]+)\~{1,2}([<_*`]|\B|\b|$)/gm, '$1<span class="copyonly">~</span><strike>$2</strike><span class="copyonly">~</span>$3')

			# Support >Text for quote
			msg = msg.replace(/^&gt;(.*)$/gm, '<blockquote><span class="copyonly">&gt;</span>$1</blockquote>')
			msg = msg.replace(/<\/blockquote>\n<blockquote>/gm, '</blockquote><blockquote>')

			message.html = msg

			console.log 'Markdown', message if window.rocketDebug

		return message

RocketChat.callbacks.add 'renderMessage', Markdown, RocketChat.callbacks.priority.HIGH
RocketChat.Markdown = true
