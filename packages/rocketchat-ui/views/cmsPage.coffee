Template.cmsPage.onCreated ->
	@page = new ReactiveVar ''
	Meteor.autorun =>
		if Session.get('cmsPage')?
			@page.set RocketChat.settings.get Session.get('cmsPage')

Template.cmsPage.helpers
	page: ->
		return Template.instance().page.get()