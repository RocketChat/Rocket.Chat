Template.body.onRendered ->
	dataLayerComputation = Tracker.autorun ->
		w = window
		d = document
		s = 'script'
		l = 'dataLayer'
		i = Settings.findOne('API.Analytics')?.value
		if i
			do (w,d,s,l,i) ->
				w[l] = w[l] || []
				w[l].push {'gtm.start': new Date().getTime(), event:'gtm.js'}
				f = d.getElementsByTagName(s)[0]
				j = d.createElement(s)
				dl = if l isnt 'dataLayer' then '&l=' + l else ''
				j.async = true
				j.src = '//www.googletagmanager.com/gtm.js?id=' + i + dl
				f.parentNode.insertBefore j, f
				dataLayerComputation.stop()