/**
 * Created by khurrum on 8/22/15.
 */
// #### Eraser Tool   #### //

EraserTool = function EraserTool(params) {
	baseTool.call(this, params);
	this.size = new ReactiveVar(params.size || 8);
	this.alpha = new ReactiveVar(params.alpha || 100);
	this.hardness = new ReactiveVar(params.hardness || 100);
	this.mode = new ReactiveVar(params.mode || 0);
	this.currentEvent = null;

};

EraserTool.prototype = Object.create(baseTool.prototype);

_.extend(EraserTool, {
	fromStore: function (type, params) {
		var params = {
			type: type,
			alpha: params.a,
			size: params.s,
			hardness: params.h,
			mode: params.m,
		};

		return new EraserTool(params);
	},
});


_.extend(EraserTool.prototype, {

	toStore: function () {
		var store = {
			s: this.size.curValue,
			a: this.alpha.curValue,
			h: this.hardness.curValue,
			m: this.mode.curValue,
		};

		if (this.type.curValue === 'eraser') {
			delete store.c;
		}

		return store;
	},

	setMouseCursor: function (param, value) {
		var $canvas = $('#__drawingCanvas canvas#drawingBoard'); //TODO: Make this a variable. no hardcoding
		var $cursorCanvas = $('#cursorCanvas');
		$canvas.css('cursor', 'crosshair');
		$("#__drawingCanvas").panzoom("option", {
			disablePan: true,
			disableZoom: true,
		});

		var canvas = $cursorCanvas[0];
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		var currentBrush = this;
		var param = typeof param !== 'undefined' ? param : 'size';
		var value = typeof value !== 'undefined' ? value : PaintChat.getTool()[param].get();

		if (param === 'size') {
			var size = value;
			$cursorCanvas.attr('width', size).attr('height', size);
			var center = size / 2;
			ctx.arc(center, center, center * 0.7, 0, Math.PI * 2, false);
			ctx.stroke();
		}
	},

	toolDown: function (e, drawArea, picture, roomid) {

		var coords = PaintChat.getRelativeCoords(e, drawArea);
		var oldPixel = picture.getPixelRGBA(coords);

		this.currentEvent = picture.createBrushEvent(
			this.getColor(),
			0.999 + 0.000999999 * (this.getHardness() / 100),
			// 0.5 + brush.getHardness() / 200,    // flow = blendControl
			this.getAlpha() / 100,
			this.getSize(),
			0, // textureId
			1 - this.getHardness() / 100,    // softness
			this.getMode());
		//console.log(this.currentEvent);
		var coords = PaintChat.getRelativeCoords(e, drawArea);
		var pressure = 0.75;
		picture.pictureTransform.inverseTransform(coords);
		this.currentEvent.pushCoordTriplet(coords.x, coords.y, pressure);
		this.currentEvent.pushCoordTriplet(coords.x, coords.y + 0.0001, pressure);

	},

	toolUp: function (e, drawArea, picture, roomId) {

		//Tracker.autorun(function() {
		//	console.log(Session.get('openedRoom'));
		//});
		//	console.log("Is strokes sub ready?:", FlowRouter.subsReady("strokes"));
		//	console.log("Does all subscriptions ready?:", FlowRouter.subsReady());
		//});
		if (this.currentEvent !== null) {
			ignoreStrokes = true;
			//var brush = PaintChat.getBrush();

			Meteor.call('insertStroke', {
				userId: Meteor.userId(),
				sessionId: Meteor.connection._lastSessionId,
				roomId: Session.get('openedRoom'),
				boardId: 0,
				tool: this.getType(),
				params: {
					c: this.getColor(),
					a: this.getAlpha() / 100,
					s: this.getSize(),
					h: 1 - this.getHardness() / 100,
					m: this.getMode(),
				},
				coords: this.currentEvent.coords,
			}, function (error, result) {
				//console.log('error' + error);
				//console.log('result' + result);
			});

			picture.setCurrentEvent(null);
			var update = new PictureUpdate('add_picture_event');
			update.setPictureEvent(0, this.currentEvent);
			picture.pushUpdate(update);
			picture.display();
			this.currentEvent = null;
		}
		//console.log(this);
	},

	toolOut: function (e, drawArea, picture) {
		return 0
	},

	toolMove: function (e, drawArea, picture) {
		//Area.Presences.update(e);
		Area.Presences.update(e);
		var coords = PaintChat.getRelativeCoords(e, drawArea);
		var $cursorCanvas = $('#cursorCanvas');
		$cursorCanvas.css({
			'left': (coords.x - ($cursorCanvas.width() / 2) + 0.5 ),
			'top': (coords.y - ($cursorCanvas.width() / 2) + 0.5 )
		});

		if (this.currentEvent !== null) {
			// var pressure = (Math.sin(pressureInd * 0.4) + 2.0) * 0.33;
			var pressure = 0.75;
			picture.pictureTransform.inverseTransform(coords);
			this.currentEvent.pushCoordTriplet(coords.x, coords.y, pressure);
			picture.setCurrentEvent(this.currentEvent);
			picture.display();

		}
		//console.log(this);
	},

	toolDrag: function (e, drawArea, picture) {
		return 0
	},

	keyDown: function (e) {
		//console.log(e);
		if (e.altKey && isAltDown === true) {
			///console.log(e);
			var tool = PaintChat.getTool(1);
			tool.setMouseCursor();
			PaintChat.setActiveTool(1);
			//console.log(tool);
		}
	},

	keyUp: function (e) {
		//console.log(e);
		if (e.keyCode === 18) {
			isAltDown = false;
			var tool = PaintChat.getTool(0);
			//    console.log(tool);
			tool.setMouseCursor();
			PaintChat.setActiveTool(0);
		}
	},

	getColor: function () {
		return PaintChat.foregroundColor.getColor();
	},

	getSize: function () {
		return this.size.get();
	},

	getHardness: function () {
		return this.hardness.get();
	},

	getAlpha: function () {
		return this.alpha.get();
	},

	getMode: function () {
		return 0;
	}


});
