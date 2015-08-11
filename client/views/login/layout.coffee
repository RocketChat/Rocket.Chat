Template.loginLayout.rendered = ->
	$('html').addClass("scroll").removeClass "noscroll"
	if not Meteor.isCordova
		window.pJSDom = []
		particlesJS.load 'particles-js', '/scripts/particles.json', ->