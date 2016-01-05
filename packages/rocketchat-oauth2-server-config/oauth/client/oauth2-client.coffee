FlowRouter.route '/oauth/authorize',
	action: (params, queryParams) ->
		BlazeLayout.render 'main',
			center: 'authorize'
			modal: true
			client_id: queryParams.client_id
			redirect_uri: queryParams.redirect_uri
			response_type: queryParams.response_type
			state: queryParams.state


Template.authorize.onCreated ->
	@subscribe 'authorizedOAuth'


Template.authorize.helpers
	getToken: ->
		return localStorage.getItem('Meteor.loginToken')


Template.authorize.onRendered ->
	@autorun (c) =>
		if Meteor.user()?.oauth?.athorizedClients?.indexOf(@data.client_id()) > -1
			c.stop()
			$('button').click()
