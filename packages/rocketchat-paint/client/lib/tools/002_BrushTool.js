/**
 * Created by khurrum on 8/22/15.
 */

//TODO: remove context

// #### Brush Tool    #### //
BrushTool = function BrushTool(params) {
	baseTool.call(this, params);
	this.size = new ReactiveVar(params.size || 8);
	this.alpha = new ReactiveVar(params.alpha || 100);
	this.hardness = new ReactiveVar(params.hardness || 100);
	this.mode = new ReactiveVar(params.mode || 1);
	this.texture = new ReactiveVar(params.texture || 0);
	this.scatter = new ReactiveVar(params.scatter || 0);
	this.spacing = new ReactiveVar(params.spacing || 0);
	this.flow = new ReactiveVar(params.flow || 100);
	this.currentEvent = null
}

BrushTool.prototype = Object.create(baseTool.prototype);

_.extend(BrushTool, {
	fromStore: function (type, params) {
		var params = {
			type: type,
			alpha: params.a,
			size: params.s,
			hardness: params.h,
			texture: params.t,
			mode: params.m,
			scatter: params.sc,
			spacing: params.sp,
			flow: params.f,
		};

		return new BrushTool(params);
	},
});

_.extend(BrushTool.prototype, {
	toStore: function () {
		var store = {
			s: this.size.curValue,
			a: this.alpha.curValue,
			h: this.hardness.curValue,
			t: this.texture.curValue,
			m: this.mode.curValue,
			sc: this.scatter.curValue,
			sp: this.spacing.curValue,
			f: this.flow.curValue,
		};

		if (this.type.curValue === 'eraser') {
			delete store.c;
		}

		return store;
	},

	setMouseCursor: function (param, value) {
		var $canvas = $('#__drawingCanvas canvas#drawingBoard'); //TODO: Make this a variable. no hardcoding
		var scale = $canvas[0].width / $canvas[0].offsetWidth;
		var $cursorCanvas = $('#cursorCanvas');
		$canvas.css('cursor', 'crosshair');
		var canvas = $cursorCanvas[0];
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		//$("#__drawingCanvas").panzoom("destroy");
		$("#__drawingCanvas").panzoom("option", {
			disablePan: true,
			disableZoom: true,
		});

		var currentBrush = this;
		var param = typeof param !== 'undefined' ? param : 'size';
		var value = typeof value !== 'undefined' ? value : PaintChat.getTool()[param].get();

		if (param === 'size') {
			var size = value / scale;
			$cursorCanvas.attr('width', size).attr('height', size);
			var center = size / 2;
			ctx.arc(center, center, center * 0.7, 0, Math.PI * 2, false);
			ctx.stroke();
		}
	},

	toolDown: function (e, drawArea, picture, roomid) {
		//console.log(this.getMode());
		//var coords = PaintChat.getRelativeCoords(e, drawArea);
		//var oldPixel = picture.getPixelRGBA(coords);


		//Picture.prototype.createBrushEvent = function(color, flow, opacity, radius, textureId, softness, mode)

		this.currentEvent = picture.createBrushEvent(
			this.getColor(),   //color
			this.getFlow() / 100,  // 0.999 + 0.000999999 * (this.getHardness() / 100), //flow (?)
			this.getAlpha() / 100, //opacity
			this.getSize(), //radius
			this.getTexture(), // textureId
			1 - this.getHardness() / 100,    // softness
			this.getMode()); //mode

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
			picture.setCurrentEvent(null);
			var update = new PictureUpdate('add_picture_event');
			update.setPictureEvent(0, this.currentEvent);
			picture.pushUpdate(update);
			picture.display();
			//console.log(update.pictureEvent.sessionEventId);

			Meteor.call('insertStroke', {
				userId: Meteor.userId(),
				sessionId: Meteor.connection._lastSessionId,
				sessionEventId: update.pictureEvent.sessionEventId,
				roomId: Session.get('openedRoom'),
				boardId: 0,
				tool: this.getType(),
				params: {
					c: this.getColor(),
					a: this.getAlpha() / 100,
					s: this.getSize(),
					h: 1 - this.getHardness() / 100,
					t: this.getTexture(),
					m: this.getMode(),
					f: this.getFlow() / 100,
					sc: this.getScatter(),
					sp: this.getSpacing(),
				},
				coords: this.currentEvent.coords,
			}, function (error, result) {
				//console.log('error' + error);
				//console.log('result' + result);
			});

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
		var cursorcoords = PaintChat.getRelativeCoords(e, drawArea);
		var coords = PaintChat.getRelativeCoords(e, drawArea);
		var $cursorCanvas = $('#cursorCanvas');
		$cursorCanvas.css({
			'left': (cursorcoords.x - ($cursorCanvas.width() / 2) + 0.5 ),
			'top': (cursorcoords.y - ($cursorCanvas.width() / 2) + 0.5 )
		});

		if (this.currentEvent !== null) {
			// var pressure = (Math.sin(pressureInd * 0.4) + 2.0) * 0.33;
			var pressure = 0.75;
			picture.pictureTransform.inverseTransform(coords);
			//this.currentEvent.brushTip.scatterOffset = this.getScatter();
			//this.currentEvent.brushTip.spacing = this.getSpacing();
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
		return parseInt(this.size.get(), 10);
	},

	setSize: function (size) {
		this.size.set(size);
	},

	getHardness: function () {
		return this.hardness.get();
	},

	getTexture: function () {
		return this.texture.get();
	},

	getAlpha: function () {
		return this.alpha.get();
	},

	getMode: function () {
		return parseInt(this.mode.get(), 10);
	},

	getScatter: function () {
		//return parseInt(this.scatter.get(), 10);
		return this.scatter.get();
	},

	getSpacing: function () {
		//return parseInt(this.spacing.get(), 10);
		return this.spacing.get();
	},

	getFlow: function () {
		return parseInt(this.flow.get(), 10);
	},

});
