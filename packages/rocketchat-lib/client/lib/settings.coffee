###
# RocketChat.settings holds all packages settings
# @namespace RocketChat.settings
###

@Settings = new Meteor.Collection 'rocketchat_settings'

RocketChat.settings.subscription = Meteor.subscribe 'settings'

RocketChat.settings.dict = new ReactiveDict 'settings'

RocketChat.settings.get = (_id) ->
	return RocketChat.settings.dict.get(_id)

RocketChat.settings.init = ->
	initialLoad = true
	Settings.find().observe
		added: (record) ->
			Meteor.settings[record._id] = record.value
			RocketChat.settings.dict.set record._id, record.value
			RocketChat.settings.load record._id, record.value, initialLoad
		changed: (record) ->
			Meteor.settings[record._id] = record.value
			RocketChat.settings.dict.set record._id, record.value
			RocketChat.settings.load record._id, record.value, initialLoad
		removed: (record) ->
			delete Meteor.settings[record._id]
			RocketChat.settings.dict.set record._id, undefined
			RocketChat.settings.load record._id, undefined, initialLoad
	initialLoad = false

RocketChat.settings.init()

Meteor.startup ->
	Tracker.autorun (c) ->
		siteUrl = RocketChat.settings.get('Site_Url')
		if not siteUrl or not Meteor.userId()?
			return

		if RocketChat.authz.hasRole(Meteor.userId(), 'admin') is false
			return c.stop()

		siteUrl = siteUrl.replace /\/$/, ''
		if siteUrl isnt location.origin
			toastr.warning TAPi18n.__('The_configured_URL_is_different_from_the_URL_you_are_accessing'), TAPi18n.__('Warning')

		return c.stop()
