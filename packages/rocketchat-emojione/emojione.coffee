###
# Emojione is a named function that will replace emojis
# @param {Object} message - The message object
###

class Emojione
	constructor: (message) ->
		if _.trim message.html
			message.html = emojione.toImage(message.html)
			
		return message

RocketChat.callbacks.add 'renderMessage', Emojione, RocketChat.callbacks.priority.LOW, 'emoji'

if Meteor.isClient
	Meteor.startup ->
		Tracker.autorun ->
			if Meteor.user()?.settings?.preferences?.useEmojis or not Meteor.user()?.settings?.preferences?.useEmojis?
				RocketChat.callbacks.add 'renderMessage', Emojione, RocketChat.callbacks.priority.LOW, 'emoji'
			else
				RocketChat.callbacks.remove 'renderMessage', 'emoji'