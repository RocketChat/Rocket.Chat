/**
 * Created by khurrum on 9/21/15.
 */

PaintChat = {};

PaintChat.theW = 2160;//1152; //1536;  610 1220;
PaintChat.theH = 1080; //576; //768;    435 870; //

PaintChat.zoom = {
	factor: function () {
		return Math.sqrt(2);
	},

	level: new ReactiveVar(0.5),

	zoomIn: function () {
		var lvl = PaintChat.zoom.level.get();
		if (lvl <= 0.01) return;
		PaintChat.zoom.level.set(lvl / this.factor);
	},

	zoomOut: function () {
		var lvl = PaintChat.zoom.level.get();
		if (lvl > 3) return;
		PaintChat.zoom.level.set(lvl * this.factor);
	}
};

ForegroundColor = function (params) {
	this.color = new ReactiveVar(params.color || [0, 16, 32]);
};

ForegroundColor.prototype = {
	setColor: function (params) {
		this.color.set(params);

	},
	getColor: function () {
		return this.color.get();
	},

	getRGBString: function () {
		var arr = this.getColor();
		return "rgb(" + arr[0] + ", " + arr[1] + ", " + arr[2] + ")";

	}
};


PaintChat.foregroundColor = new ForegroundColor({color: [198, 52, 16]});

PaintChat.tools = {
	list: [
		new BrushTool({
			name: 'Brush Tool',
			iconName: 'fa fa-paint-brush',
			type: 'standard',
			color: PaintChat.foregroundColor.getColor(),
			//size:     P,
			//alpha:    100,
			//hardness: 80,
			mode: 1,
			settingsTemplate: 'brushSettings'
		}),
		new ColorPicker({
			name: 'ColorPicker Tool',
			iconName: 'fa fa-eyedropper',
			type: 'colorPicker',
		}),
		new EraserTool({
			name: 'Eraser Tool',
			iconName: 'fa fa-eraser',
			type: 'eraser',
		}),
		new ZoomTool({
			name: 'ZoomTool',
			iconName: 'fa fa-search',
			type: 'zoom',
		}),
		/*new PanMoveTool({
		 name:		'PanMoveTool',
		 iconName:	'fa fa-arrows',
		 type:		'pan-move',
		 }),*/
	],
	count: new ReactiveVar(4),
	index: new ReactiveVar(0)
};

PaintChat.textures = [{
	name: "Chalk 1",
	url: "/packages/paintchat_paintchat-main/public/textures/chalk1-128.png",
	//icon
}, {
	name: "Chalk 2",
	url: "/packages/paintchat_paintchat-main/public/textures/chalk2-128.png",
}, {
	name: "Chalk 3",
	url: "/packages/paintchat_paintchat-main/public/textures/chalk3-128.png",
}, {
	name: "Chalk 4",
	url: "/packages/paintchat_paintchat-main/public/textures/chalk4-128.png",
}, {
	name: "Speckled Brush",
	url: "/packages/paintchat_paintchat-main/public/textures/speckled-128.png",
}, {
	name: "Rough Brush",
	url: "/packages/paintchat_paintchat-main/public/textures/brush6-128.png",
}];

PaintChat.getTextures = function () {
	var promises = [];
	PaintChat.brushTextureData = [];
	for (var i = 0; i < PaintChat.textures.length; i++) {
		(function (url, promise) {
			var img = new Image();
			img.onload = function () {
				promise.resolve();
			};
			img.src = url;
			PaintChat.brushTextureData.push(img);
		})(PaintChat.textures[i].url, promises[i] = $.Deferred());
	}
	$.when.apply($, promises).done(function () {
		//console.log('images loaded');
		//console.log(brushTextureData);
		return PaintChat.brushTextureData;
	});
};


/*



 var brushTextureData = []
 for (var x = 0; x < PaintChat.textures.length; x++){
 var image = document.createElement('img');
 //image.onload = function () {
 //	console.log('img loaded');
 //}
 image.src = PaintChat.textures[x].url;
 brushTextureData.push(image);

 }
 return brushTextureData;*/


PaintChat.getTool = function (idx) {
	if (typeof idx === 'undefined') idx = PaintChat.tools.index.get();
	idx = 0 + idx;
	return PaintChat.tools.list[idx];
};

PaintChat.setActiveTool = function (idx) {
	PaintChat.tools.index.set(idx);
};

PaintChat.createCanvas = function (parent) {
	return console.log('creating canvas');
};

PaintChat.resetCanvas = function () {
	$("#drawingBoard").remove();
	PaintChat.Picture = PaintChat.resetPicture(Session.get('openedRoom'), PaintChat.theW, PaintChat.theH);
	PaintChat.drawArea = document.getElementById('__drawingCanvas');
	PaintChat.attachPicture(PaintChat.Picture, PaintChat.drawArea);
	PaintChat.startLines();
	PaintChat.theCanvas = document.getElementById('drawingBoard');
	$panzoom = $("#__drawingCanvas").panzoom();
	$panzoom.on('mousewheel.focal', function (e) {
		e.preventDefault();
		var delta = e.delta || e.originalEvent.wheelDelta;
		var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
		$panzoom.panzoom('zoom', zoomOut, {
			increment: 0.05,
			animate: false,
			focal: e
		});
	});

	$panzoom.panzoom("option", {
		disablePan: true,
		disableZoom: true
	});
	//console.log("panZoom disable");


	Area.Presences.init(Session.get('openedRoom'), 0, PaintChat.theCanvas, PaintChat.Picture);

	PaintChat.getTool().setMouseCursor();

	isMouseDown = false;    //todo: better way of detecting dragging.
};

PaintChat.createPicture = function (name, width, height) {

	var picture = new Picture(
		name,
		name,
		new Rect(0, width, 0, height),
		1.0,
		PictureRenderer.create(['webgl', 'no-float-webgl', 'canvas'], PaintChat.brushTextureData));
	picture.addBuffer(0, [255, 255, 255, 255], true);
	picture.setCurrentEventAttachment(0);
	//console.log('picture in createpicture');
	//console.log(picture);
	//PaintChat.attachPicture(picture, drawArea);
	return picture;


};

PaintChat.resetPicture = function (name, width, height) {
	var picture = PaintChat.createPicture(name, width, height);
	picture.crop(picture.boundsRect, PaintChat.zoom.level.get());
	return picture;
};

PaintChat.attachPicture = function (picture, element) {
	//Attach the picture
	if (element) {
		//console.log(element);
		element.appendChild(picture.pictureElement());
		picture.display();
	} else {
		return false;
	}
};

PaintChat.removeChildren = function (element) {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
};

PaintChat.canvasState = function (data) {
	this.data = data;
}

PaintChat.destroyPicture = function (picture) {
	picture.destroy();
	picture.display();
};

PaintChat.clearPicture = function (picture) {
//
};

PaintChat.clearCanvas = function (canvas) {
};

PaintChat.stopObserver = function (observer) {
	return console.log('stop observer.. though autoruns should do this');
};

PaintChat.getRelativeCoords = function getRelativeCoords(event, element) {
	//to make up for css width and height adjustments to canvas
	//var scale = element.width / element.offsetWidth;
	var rect = element.getBoundingClientRect();
	//console.log(rect);
	var scale = element.width / rect.width;

	// + 0.5 to move to pixel center
	if (event.touches !== undefined && event.touches.length > 0) {
		return new Vec2(scale * (event.touches[0].clientX - rect.left + 0.5),
			scale * (event.touches[0].clientY - rect.top + 0.5));
	}
	return new Vec2(scale * (event.clientX - rect.left + 0.5),
		scale * (event.clientY - rect.top + 0.5));
};


PaintChat.drawLine = function (line, target) {
	//console.log("start drawing a line");
	//(color, flow, opacity, radius,textureId, softness, mode)
	if (line.params.m === undefined) {
		line.params.m = 1;
	}
	var event = target.createBrushEvent(
		line.params.c,
		line.params.f,
		line.params.a,
		line.params.s,
		line.params.t,
		line.params.h,
		line.params.m);

	//console.log(event);
	for (var i = 0; i < line.coords.length; i += 3) {
		event.pushCoordTriplet(line.coords[i], line.coords[i + 1], line.coords[i + 2]);
	}
	var update = new PictureUpdate('add_picture_event');
	update.setPictureEvent(0, event);
	//var jsonified = JSON.stringify(event);
	//event.fromJS(jsonified);
	target.pushUpdate(update);
	target.display();
	//target.animate(0.99)
};

PaintChat.startLines = function () {
	PaintChat.Strokes = Strokes.find({roomId: Session.get('openedRoom')}, {sort: {submitted: 1}}).observeChanges({
		added: function (id, line) {
			if (PaintChat.ignoreStrokes && (line.userId === Meteor.userId())) {
				//console.log("ignoreStrokes and self painting");
				return false;
			} else if ((line.userId === Meteor.userId()) && (line.sessionId === Meteor.connection._lastSessionId) && (line.submitted > Session.get('joinTime'))) {
				//console.log("Don't show me my own lines");
				return false;
			}
			else {
				//console.log(line);
				PaintChat.drawLine(line, PaintChat.Picture);
			}
		},
		removed: function (id) {
			resetCanvasDebounced()
		}
	});
};

var resetCanvasDebounced = _.debounce(function () {
	PaintChat.resetCanvas();
	Strokes.find({roomId: Session.get('openedRoom')}, {sort: {submitted: 1}}).forEach(function (line) {
		PaintChat.drawLine(line, PaintChat.Picture);
	});
}, 100);
