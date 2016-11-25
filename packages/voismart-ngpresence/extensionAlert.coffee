Template.extensionAlert.events
	'click .install': (e, instance) ->
		if navigator.userAgent.toLocaleLowerCase().indexOf('chrome') > -1
			browser = 'chrome'
		else if navigator.userAgent.toLocaleLowerCase().indexOf('firefox') > -1
			browser = 'firefox'
		else
			browser = undefined

		showConfiguration = ->
			instance.$('.extension-configuration').removeClass('hidden')

		if browser == 'chrome'
			chrome.webstore.install undefined, showConfiguration, ->
				window.open('https://chrome.google.com/webstore/detail/nocfbnnmjnndkbipkabodnheejiegccf')
				showConfiguration()
		else if browser == 'firefox'
			window.open('https://addons.mozilla.org/en-GB/firefox/addon/rocketchat-screen-share/')
			showConfiguration()

		instance.$('.extension-alert').addClass('hidden')

	'click .icon-cancel': (e, instance) ->
		instance.$('.extension-alert').addClass('hidden')

	'click .configurationOk': (e, instance) ->
		instance.$('.extension-configuration').addClass('hidden')


Template.extensionAlert.helpers
	logged: ->
		return if Meteor.userId() then true else false

	configurationTextPart1: ->
		return TAPi18n.__ "Presence_Extension_Configuration_Part1"

	configurationTextPart2: ->
		return TAPi18n.__ "Presence_Extension_Configuration_Part2", window.location.origin + '/*'
