FlowRouter.route '/external',
	name: 'index'

	triggersEnter: [
		->
			console.log 'entrando na rota'
	]

	action: ->
		BlazeLayout.render 'main', {center: 'room'}
