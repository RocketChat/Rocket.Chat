Template.loginLayout.rendered = ->
	$('html').addClass("scroll").removeClass "noscroll"
	$('.connect').constellation({
		line: {
			color: 'rgba(255, 255, 255, .4)'
		}
	});
