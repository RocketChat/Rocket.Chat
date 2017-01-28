Meteor.startup ->
	RocketChat.TabBar.addButton(
		groups: ['channel', 'privategroup', 'directmessage']
		id: 'paint',
		i18nTitle: 'Paint',
		icon: 'fa fa-refresh fa-spin',
		template: 'drawingBoardMain',
		width: 675,
		order: 11
	)

RocketChat.callbacks.add 'enter-room', ->
	_.each(PaintChat.tools.list, (tool, idx) -> tool.index.set(idx))
	PaintChat.tools.count.set(PaintChat.tools.list.length)
, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-paint'

RocketChat.callbacks.add 'enter-room', ->
	PaintChat.getTextures() # Load all the textures for the brushes.
	#console.log RocketChat.TabBar.getTemplate()
	if RocketChat.TabBar.getTemplate() == "drawingBoardMain"
#console.log "I found drawingBoardMain"
		Session.set('settingsTemplate', null)
		if PaintChat.drawingCanvas
			Blaze.remove(PaintChat.drawingCanvas)
			PaintChat.Strokes.stop();
			PaintChat.drawingCanvas = Blaze.render(Template.drawingCanvas, $('#drawingCanvas')[0])
#console.log ('replaced drawingCanvas');
	else
		return 0
, RocketChat.callbacks.priority.MEDIUM, 'deal-with-room-change'

RocketChat.callbacks.add 'enter-room', ->
	setTimeout ->
		RocketChat.TabBar.setTemplate 'drawingBoardMain', ->
			RocketChat.TabBar.openFlex()
	, 500
, RocketChat.callbacks.priority.HIGH, 'open-flex'


