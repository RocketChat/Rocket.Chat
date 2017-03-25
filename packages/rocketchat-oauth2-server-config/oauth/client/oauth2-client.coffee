# @ChatOAuthApps = new Mongo.Collection 'rocketchat_oauth_apps'

FlowRouter.route '/oauth/authorize',
	action: (params, queryParams) ->
		BlazeLayout.render 'main',
			center: 'authorize'
			modal: true
			client_id: queryParams.client_id
			redirect_uri: queryParams.redirect_uri
			response_type: queryParams.response_type
			state: queryParams.state


FlowRouter.route '/oauth/error/:error',
	action: (params, queryParams) ->
		BlazeLayout.render 'main',
			center: 'oauth404'
			modal: true
			error: params.error


Template.authorize.onCreated ->
	@subscribe 'authorizedOAuth'
	@subscribe 'oauthClient', @data.client_id()


Template.authorize.helpers
	getToken: ->
		return localStorage.getItem('Meteor.loginToken')

	getClient: ->
		return ChatOAuthApps.findOne()


Template.authorize.events
	'click #logout-oauth': ->
		return Meteor.logout()

	'click #cancel-oauth': ->
		return window.close()


Template.authorize.onRendered ->
	@autorun (c) =>
		if Meteor.user()?.oauth?.authorizedClients?.indexOf(@data.client_id()) > -1
			c.stop()
			$('button[type=submit]').click()
