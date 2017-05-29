Meteor.startup ->
	return unless Meteor.isCordova

	# Handle click events for all external URLs
	document.addEventListener 'deviceready', ->
		$(document).on 'click', (e) ->
			$link = $(e.target).closest('a[href]')
			return unless $link.length > 0
			url = $link.attr('href')

			if /^https?:\/\/.+/i.test(url) is true
				window.open url, '_system'
				e.preventDefault()
