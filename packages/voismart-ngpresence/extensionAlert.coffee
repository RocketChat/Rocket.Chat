Template.extensionAlert.events
	'click .install': (e, instance) ->
		showConfiguration = ->
			instance.$('.extension-configuration').removeClass('hidden')
		showAlert = ->
			instance.$('.popup-warning').removeClass('hidden')

		if this.browser == 'chrome'
			chrome.webstore.install undefined, showConfiguration, ->
				win = window.open 'https://chrome.google.com/webstore/detail/dapnjppagigkdklehjnihbflmgkpbapm'
				showConfiguration()
				if not win
					showAlert()
		else if this.browser == 'firefox'
			win = window.open('https://addons.mozilla.org/en-GB/firefox/addon/rocketchat-screen-share/')
			showConfiguration()
			if not win
				showAlert()

		instance.$('.extension-alert').addClass('hidden')

	'click .icon-cancel': (e, instance) ->
		instance.$('.extension-alert').addClass('hidden')

	'click .configurationOk': (e, instance) ->
		instance.$('.extension-configuration').addClass('hidden')
		instance.$('.popup-warning').addClass('hidden')


Template.extensionAlert.helpers
	logged: ->
		return if Meteor.userId() then true else false

	configurationTextTitle: ->
		return TAPi18n.__ "Presence_Extension_Configuration_Title"

	configurationTextPart1: ->
		return TAPi18n.__ "Presence_Extension_Configuration_Part1"

	configurationTextPart2: ->
		return TAPi18n.__ "Presence_Extension_Configuration_Part2", window.location.origin + '/*'

	menuImage: ->
		if this.browser == 'firefox'
			return 'images/presence_exten_menu_firefox.png'
		else
			return 'images/presence_exten_menu.png'

	configImage: ->
		if this.browser == 'firefox'
			return 'images/presence_exten_config_firefox.png'
		else
			return 'images/presence_exten_config.png'
