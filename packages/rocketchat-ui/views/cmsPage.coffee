Template.cmsPage.onCreated ->
	@page = new ReactiveVar ''
	Meteor.autorun =>
		if Session.get('cmsPage')?
			@page.set RocketChat.settings.get Session.get('cmsPage')

Template.cmsPage.helpers
	page: ->
		return Template.instance().page.get()

Template.cmsPage.events
	'click .cms-page-close': ->
		FlowRouter.go('/')

Template.cmsPage.onRendered ->
	$('#initial-page-loading').remove()
