FlowRouter.route '/external',
	name: 'index'

	triggersEnter: [
		->
			visitor.register()
			console.log 'entrando na rota'
	]

	action: ->
		BlazeLayout.render 'main', {center: 'room'}
