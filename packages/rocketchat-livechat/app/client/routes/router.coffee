BlazeLayout.setRoot('body');

FlowRouter.route '/livechat',
	name: 'index'

	triggersEnter: [
		->
			visitor.register()
	]

	action: ->
		if Meteor.userId()
			BlazeLayout.render 'main', {center: 'room'}
		else
			BlazeLayout.render 'main', {center: 'register'}
