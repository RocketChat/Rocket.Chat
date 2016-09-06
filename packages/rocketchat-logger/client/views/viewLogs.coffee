Template.viewLogs.onCreated ->
	@subscribe 'stdout'
	@atBottom = true


Template.viewLogs.helpers
	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'view-logs'

	logs: ->
		return stdout.find({}, {sort: {ts: 1}})

	ansispan: (string) ->
		string = ansispan(string.replace(/\s/g, '&nbsp;').replace(/(\\n|\n)/g, '<br>'))
		string = string.replace(/(.\d{8}-\d\d:\d\d:\d\d\.\d\d\d\(?.{0,2}\)?)/, '<span class="time">$1</span>')
		return string

	formatTS: (date) ->
		return moment(date).format('YMMDD-HH:mm:ss.SSS(ZZ)')


Template.viewLogs.events
	'click .new-logs': (e) ->
		Template.instance().atBottom = true
		Template.instance().sendToBottomIfNecessary()


Template.viewLogs.onRendered ->
	wrapper = this.find('.terminal')
	wrapperUl = this.find('.terminal')
	newLogs = this.find('.new-logs')

	template = this

	template.isAtBottom = ->
		if wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight
			newLogs.className = "new-logs not"
			return true
		return false

	template.sendToBottom = ->
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight
		newLogs.className = "new-logs not"

	template.checkIfScrollIsAtBottom = ->
		template.atBottom = template.isAtBottom()
		readMessage.enable()
		readMessage.read()

	template.sendToBottomIfNecessary = ->
		if template.atBottom is true and template.isAtBottom() isnt true
			template.sendToBottom()
		else if template.atBottom is false
			newLogs.className = "new-logs"

	template.sendToBottomIfNecessaryDebounced = _.debounce template.sendToBottomIfNecessary, 10

	template.sendToBottomIfNecessary()

	if not window.MutationObserver?
		wrapperUl.addEventListener 'DOMSubtreeModified', ->
			template.sendToBottomIfNecessaryDebounced()
	else
		observer = new MutationObserver (mutations) ->
			mutations.forEach (mutation) ->
				template.sendToBottomIfNecessaryDebounced()

		observer.observe wrapperUl,
			childList: true

	template.onWindowResize = ->
		Meteor.defer ->
			template.sendToBottomIfNecessaryDebounced()

	window.addEventListener 'resize', template.onWindowResize

	wrapper.addEventListener 'mousewheel', ->
		template.atBottom = false
		Meteor.defer ->
			template.checkIfScrollIsAtBottom()

	wrapper.addEventListener 'wheel', ->
		template.atBottom = false
		Meteor.defer ->
			template.checkIfScrollIsAtBottom()

	wrapper.addEventListener 'touchstart', ->
		template.atBottom = false

	wrapper.addEventListener 'touchend', ->
		Meteor.defer ->
			template.checkIfScrollIsAtBottom()
		Meteor.setTimeout ->
			template.checkIfScrollIsAtBottom()
		, 1000
		Meteor.setTimeout ->
			template.checkIfScrollIsAtBottom()
		, 2000
