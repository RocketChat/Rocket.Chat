tabReset = ->
	RocketChat.TabBar.reset()

FlowRouter.route '/rocket-mailer',
	name: 'rocket-mailer'
	triggersEnter: [tabReset]
	triggersExit: [tabReset]
	action: ->
		BlazeLayout.render 'main', {center: 'rocketMailer'}

FlowRouter.route '/rocket-mailer/unsubscribe/:_id/:createdAt',
	name: 'rocket-mailer-unsubscribe'
	action: (params) ->
		Meteor.call 'RocketMailer.unsubscribe', params._id, params.createdAt
		BlazeLayout.render 'rocketMailerUnsubscribe'
