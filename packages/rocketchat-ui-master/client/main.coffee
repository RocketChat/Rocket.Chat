`import Clipboard from 'clipboard';`

Template.body.onRendered ->
	clipboard = new Clipboard('.clipboard')

	$(document.body).on 'keydown', (e) ->
		if e.keyCode in [80, 75] and (e.ctrlKey is true or e.metaKey is true) and e.shiftKey is false
			e.preventDefault()
			e.stopPropagation()
			toolbarSearch.focus(true)

		unread = Session.get('unread')
		if e.keyCode is 27 and e.shiftKey is true and unread? and unread isnt ''
			e.preventDefault()
			e.stopPropagation()
			swal
				title: t('Clear_all_unreads_question')
				type: 'warning'
				confirmButtonText: t('Yes_clear_all')
				showCancelButton: true
				cancelButtonText: t('Cancel')
				confirmButtonColor: '#DD6B55'
			, ->
				subscriptions = ChatSubscription.find({open: true}, { fields: { unread: 1, alert: 1, rid: 1, t: 1, name: 1, ls: 1 } })
				for subscription in subscriptions.fetch()
					if subscription.alert or subscription.unread > 0
						Meteor.call 'readMessages', subscription.rid

	$(document.body).on 'keydown', (e) ->
		target = e.target
		if(e.ctrlKey is true or e.metaKey is true)
			return
		if !(e.keyCode > 45 and e.keyCode < 91 or e.keyCode == 8)
			return
		if /input|textarea|select/i.test(target.tagName)
			return
		if target.id is 'pswp'
			return

		inputMessage = $('textarea.input-message')
		if inputMessage.length is 0
			return
		inputMessage.focus()

	$(document.body).on 'click', 'a', (e) ->
		link = e.currentTarget
		if link.origin is s.rtrim(Meteor.absoluteUrl(), '/') and /msg=([a-zA-Z0-9]+)/.test(link.search)
			e.preventDefault()
			e.stopPropagation()

			if RocketChat.Layout.isEmbedded()
				return fireGlobalEvent('click-message-link', { link: link.pathname + link.search })

			FlowRouter.go(link.pathname + link.search, null, FlowRouter.current().queryParams)

	Tracker.autorun (c) ->
		w = window
		d = document
		s = 'script'
		l = 'dataLayer'
		i = RocketChat.settings.get 'GoogleTagManager_id'
		if Match.test(i, String) and i.trim() isnt ''
			c.stop()
			do (w,d,s,l,i) ->
				w[l] = w[l] || []
				w[l].push {'gtm.start': new Date().getTime(), event:'gtm.js'}
				f = d.getElementsByTagName(s)[0]
				j = d.createElement(s)
				dl = if l isnt 'dataLayer' then '&l=' + l else ''
				j.async = true
				j.src = '//www.googletagmanager.com/gtm.js?id=' + i + dl
				f.parentNode.insertBefore j, f

	if Meteor.isCordova
		$(document.body).addClass 'is-cordova'


Template.main.helpers

	siteName: ->
		return RocketChat.settings.get 'Site_Name'

	logged: ->
		if Meteor.userId()?
			$('html').addClass("noscroll").removeClass("scroll")
			return true
		else
			$('html').addClass("scroll").removeClass("noscroll")
			return false

	useIframe: ->
		iframeEnabled = (typeof RocketChat.iframeLogin isnt "undefined")
		return (iframeEnabled and RocketChat.iframeLogin.reactiveEnabled.get())

	iframeUrl: ->
		iframeEnabled = (typeof RocketChat.iframeLogin isnt "undefined")
		return (iframeEnabled and RocketChat.iframeLogin.reactiveIframeUrl.get())

	subsReady: ->
		routerReady = FlowRouter.subsReady('userData', 'activeUsers')
		subscriptionsReady = CachedChatSubscription.ready.get()

		ready = not Meteor.userId()? or (routerReady and subscriptionsReady)
		RocketChat.CachedCollectionManager.syncEnabled = ready
		return ready

	hasUsername: ->
		return Meteor.userId()? and Meteor.user().username?

	requirePasswordChange: ->
		return Meteor.user()?.requirePasswordChange is true

	CustomScriptLoggedOut: ->
		script = RocketChat.settings.get('Custom_Script_Logged_Out') or ''
		if script.trim()
			eval(script)
		return

	CustomScriptLoggedIn: ->
		script = RocketChat.settings.get('Custom_Script_Logged_In') or ''
		if script.trim()
			eval(script)
		return

	embeddedVersion: ->
		return 'embedded-view' if RocketChat.Layout.isEmbedded()

Template.main.events

	"click .burger": ->
		console.log 'room click .burger' if window.rocketDebug
		menu.toggle()

	'touchstart': (e, t) ->
		if document.body.clientWidth > 780
			return

		t.touchstartX = undefined
		t.touchstartY = undefined
		t.movestarted = false
		t.blockmove = false
		t.isRtl = isRtl localStorage.getItem "userLanguage"
		if $(e.currentTarget).closest('.main-content').length > 0
			t.touchstartX = e.originalEvent.touches[0].clientX
			t.touchstartY = e.originalEvent.touches[0].clientY
			t.mainContent = $('.main-content')
			t.wrapper = $('.messages-box > .wrapper')

	'touchmove': (e, t) ->
		if t.touchstartX?
			touch = e.originalEvent.touches[0]
			diffX = touch.clientX - t.touchstartX
			diffY = touch.clientY - t.touchstartY
			absX = Math.abs(diffX)
			absY = Math.abs(diffY)
			width = document.body.clientWidth

			if t.movestarted isnt true and t.blockmove isnt true and absY > 5
				t.blockmove = true

			if t.blockmove isnt true and (t.movestarted is true or absX > 5)
				t.movestarted = true

				if t.isRtl
					if menu.isOpen()
						t.diff = -width + diffX
					else
						t.diff = diffX

					if t.diff < -width
						t.diff = -width
					if t.diff > 0
						t.diff = 0
				else
					if menu.isOpen()
						t.diff = width + diffX
					else
						t.diff = diffX

					if t.diff > width
						t.diff = width
					if t.diff < 0
						t.diff = 0

				t.mainContent.addClass('notransition')
				t.mainContent.css('transform', 'translate(' + t.diff + 'px)')
				t.wrapper.css('overflow', 'hidden')

	'touchend': (e, t) ->
		if t.movestarted is true
			t.mainContent.removeClass('notransition')
			t.wrapper.css('overflow', '')

			if t.isRtl
				if menu.isOpen()
					if t.diff >= -200
						menu.close()
					else
						menu.open()
				else
					if t.diff <= -60
						menu.open()
					else
						menu.close()
			else
				if menu.isOpen()
					if t.diff >= 200
						menu.open()
					else
						menu.close()
				else
					if t.diff >= 60
						menu.open()
					else
						menu.close()

Template.main.onRendered ->

	# RTL Support - Need config option on the UI
	if isRtl localStorage.getItem "userLanguage"
		$('html').addClass "rtl"
	else
		$('html').removeClass "rtl"

	$('#initial-page-loading').remove()

	window.addEventListener 'focus', ->
		Meteor.setTimeout ->
			if not $(':focus').is('INPUT,TEXTAREA')
				$('.input-message').focus()
		, 100

	Tracker.autorun ->
		swal.setDefaults({cancelButtonText: t('Cancel')})

		prefs = Meteor.user()?.settings?.preferences
		if prefs?.hideUsernames
			$(document.body).on('mouseleave', 'button.thumb', (e) ->
				RocketChat.tooltip.hide();
			)

			$(document.body).on('mouseenter', 'button.thumb', (e) ->
				avatarElem = $(e.currentTarget)
				username = avatarElem.attr('data-username')
				if username
					e.stopPropagation()
					RocketChat.tooltip.showElement($('<span>').text(username), avatarElem)
			)
		else
			$(document.body).off('mouseenter', 'button.thumb')
			$(document.body).off('mouseleave', 'button.thumb')

Meteor.startup ->
	fireGlobalEvent 'startup', true
