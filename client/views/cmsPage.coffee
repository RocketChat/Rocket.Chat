Template.cmsPage.onCreated ->
	@page = new ReactiveVar ''
	Meteor.autorun =>
		console.log Session.get('cmsPage')
		if Session.get('cmsPage')?
			Meteor.call 'cmsPage', Session.get('cmsPage'), (error, data) =>
				console.log data
				@page.set data

Template.cmsPage.helpers
	page: ->
		return Template.instance().page.get()