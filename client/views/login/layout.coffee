Template.loginLayout.rendered = ->
	$('html').addClass("scroll").removeClass "noscroll"
	particlesJS.load 'particles-js', '/scripts/particles.json', ->