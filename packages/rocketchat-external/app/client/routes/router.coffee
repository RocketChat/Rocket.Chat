FlowRouter.route '/external',
	name: 'index'

	triggersEnter: [
		->
			visitor.register()
	]

	action: ->
		BlazeLayout.render 'main', {center: 'room'}
