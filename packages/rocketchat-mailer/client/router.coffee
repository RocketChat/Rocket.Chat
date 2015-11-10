tabReset = ->
	RocketChat.TabBar.reset()

FlowRouter.route '/rocket-mailer',
	name: 'rocket-mailer'
	triggersEnter: [tabReset]
	triggersExit: [tabReset]
	action: ->
		BlazeLayout.render 'main', {center: 'rocketMailer'}

FlowRouter.route '/rocket-mailer/unsubscribe/:hash',
	name: 'rocket-mailer-unsubscribe'
	action: (params) ->
		console.log params.hash
		Meteor.call 'RocketMailer.unsubscribe', params.hash
		BlazeLayout.render 'rocketMailerUnsubscribe'
