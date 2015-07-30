Template.body.onRendered ->

	dataLayerComputation = Tracker.autorun ->
		w = window
		d = document
		s = 'script'
		l = 'dataLayer'
		i = RocketChat.settings.get 'API_Analytics'
		if Match.test(i, String) and i.trim() isnt ''
			dataLayerComputation?.stop()
			do (w,d,s,l,i) ->
				w[l] = w[l] || []
				w[l].push {'gtm.start': new Date().getTime(), event:'gtm.js'}
				f = d.getElementsByTagName(s)[0]
				j = d.createElement(s)
				dl = if l isnt 'dataLayer' then '&l=' + l else ''
				j.async = true
				j.src = '//www.googletagmanager.com/gtm.js?id=' + i + dl
				f.parentNode.insertBefore j, f

	metaLanguageComputation = Tracker.autorun ->
		if RocketChat.settings.get 'Meta:language'
			metaLanguageComputation?.stop()
			Meta.set
				name: 'http-equiv'
				property: 'content-language'
				content: RocketChat.settings.get 'Meta:language'
			Meta.set
				name: 'name'
				property: 'language'
				content: RocketChat.settings.get 'Meta:language'

	metaFBComputation = Tracker.autorun ->
		if RocketChat.settings.get 'Meta:fb:app_id'
			metaFBComputation?.stop()
			Meta.set
				name: 'property'
				property: 'fb:app_id'
				content: RocketChat.settings.get 'Meta:fb:app_id'

	metaRobotsComputation = Tracker.autorun ->
		if RocketChat.settings.get 'Meta:robots'
			metaRobotsComputation?.stop()
			Meta.set
				name: 'name'
				property: 'robots'
				content: RocketChat.settings.get 'Meta:robots'

	metaGoogleComputation = Tracker.autorun ->
		if RocketChat.settings.get 'Meta:google-site-verification'
			metaGoogleComputation?.stop()
			Meta.set
				name: 'name'
				property: 'google-site-verification'
				content: RocketChat.settings.get 'Meta:google-site-verification'

	metaMSValidateComputation = Tracker.autorun ->
		if RocketChat.settings.get 'Meta:msvalidate.01'
			metaMSValidateComputation?.stop()
			Meta.set
				name: 'name'
				property: 'msvalidate.01'
				content: RocketChat.settings.get 'Meta:msvalidate.01'


Template.main.helpers

	logged: ->
		return Meteor.userId()?

	subsReady: ->
		return not Meteor.userId()? or (FlowRouter.subsReady('userData', 'activeUsers'))

	hasUsername: ->
		return Meteor.userId()? and Meteor.user().username?

	flexOpened: ->
		console.log 'layout.helpers flexOpened' if window.rocketDebug
		return 'flex-opened' if Session.equals('flexOpened', true)

	flexOpenedRTC1: ->
		console.log 'layout.helpers flexOpenedRTC1' if window.rocketDebug
		return 'layout1' if Session.equals('rtcLayoutmode', 1)

	flexOpenedRTC2: ->
		console.log 'layout.helpers flexOpenedRTC2' if window.rocketDebug
		return 'layout2' if (Session.get('rtcLayoutmode') > 1)

	removeParticles: ->
		if Match.test pJSDom, Array
			for item in pJSDom
				item?.pJS?.fn.vendors.destroypJS()

Template.main.events

	"click .burger": ->
		console.log 'room click .burger' if window.rocketDebug
		chatContainer = $("#rocket-chat")
		if chatContainer.hasClass("menu-closed")
			chatContainer.removeClass("menu-closed").addClass("menu-opened")
		else
			chatContainer.addClass("menu-closed").removeClass("menu-opened")


Template.main.onRendered ->

	$('html').addClass("noscroll").removeClass "scroll"

	# RTL Support - Need config option on the UI
	if isRtl localStorage.getItem "userLanguage"
		$('html').addClass "rtl"
