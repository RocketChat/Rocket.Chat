/**
 * Created by khurrum on 1/17/16.
 */

Template.drawingCanvas.onCreated(function () {
	this.subscribe('strokes', Session.get('openedRoom'), 1);
	this.subscribe('presenceLog', Session.get('openedRoom'), 1)
	this.subscribe('presences', Session.get('openedRoom'), 1)

});

Template.drawingCanvas.onRendered(function () {
	Session.set('joinTime', Date.now());

	PaintChat.resetCanvas();

	PaintChat.getTool().setSettingsTemplate();
	RocketChat.TabBar.updateButton('paint', {icon: 'fa fa-paint-brush'});
});

Template.drawingCanvas.onDestroyed(function () {
});

Template.drawingCanvas.events({
	'pointerdown #drawingBoard': function (e) {
		e.preventDefault();
		isMouseDown = true;
		PaintChat.getTool().toolDown(e, PaintChat.theCanvas, PaintChat.Picture, Session.get('openedRoom'));
	},
	'pointermove #drawingBoard': function (e) {
		e.preventDefault();
		PaintChat.getTool().toolMove(e, PaintChat.theCanvas, PaintChat.Picture, Session.get('openedRoom'), isMouseDown);

	},
	'pointerup #drawingBoard': function (e) {
		isMouseDown = false;
		PaintChat.getTool().toolUp(e, PaintChat.theCanvas, PaintChat.Picture, Session.get('openedRoom'));
	},
	'pointerout #drawingBoard': function (e) {
		isMouseDown = false;
		PaintChat.getTool().toolOut(e, PaintChat.theCanvas, PaintChat.Picture, Session.get('openedRoom'));
	},
	/*'touchmove #drawingBoard': function(e, t) {
	 e.stopPropagation();
	 e.preventDefault();
	 return;
	 },*/
	'touchmove #__drawingCanvas': function (e, t) {
		//console.log('touchMove');
		//console.log(e);
		//console.log(t); I need to stop propogation or else rocket chat takes over touch move and changes UI
		//but panzoom lib needs touch move so check
		if ((PaintChat.getTool().name.curValue === 'PanMoveTool') || PaintChat.getTool().name.curValue === 'ZoomTool') {
			//console.log('panMoveTool');
			return
		} else {
			e.stopPropagation();
			e.preventDefault();

		}
	}

});

Template.drawingCanvas.onDestroyed(function () {
	//console.log("destroyed");
	Session.set('drawingBoardArea', false);

});

Template.drawingCanvas.helpers({
	// Show other presences (cursors)
	cursors: function () {
		//console.log('cursors');
		return Presences.find({
			roomId: Session.get('openedRoom'),
			userId: {$ne: Meteor.userId()},
		});
	},

	position: function () {
		var vec = new Vec2(this.x, this.y);
		PaintChat.Picture.pictureTransform.transform(vec);
		return vec;
	},

	usernameById: function (userId) {
		var user = Users.findOne(userId);
		return (!!user) ? user.username : '...';
	},

	ready: function () {
		return Template.instance().subscriptionsReady();
	}


});


