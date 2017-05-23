/**
 * Created by khurrum on 1/18/16.
 */

Template.brushSettings.helpers({

	brushValue: function (params) {
		//Todo: Fix this madness
		if (PaintChat.getTool()[params] !== undefined) {
			return PaintChat.getTool()[params].get();
		} else {
			return {size: '0', alpha: '0', hardness: '0', mode: '1'}
		}
		//return PaintChat.getTool()[params].get();
	},

	blendModes: function () {
		var blendModes = new Array();
		for (var key in PictureEvent.Mode) {
			if (PictureEvent.Mode.hasOwnProperty(key)) {
				//blendModes.push([key, PictureEvent.Mode[key]]);
				if (PictureEvent.Mode[key] !== 0) {
					blendModes.push({mode: key, key: PictureEvent.Mode[key]});
				}
			}
		}
		return blendModes;
	},

	brushTextures: function () {
		var TextureInformation = [];
		for (var i = 0; i < PaintChat.textures.length; i++) {
			var key = i + 1;
			TextureInformation.push({key: key, name: PaintChat.textures[i].name, url: PaintChat.textures[i].url});
		}
		//console.log(TextureInformation);
		return TextureInformation;
	},

});

Template.brushSettings.events({
	//todo: pointermove ONLY if pointer is also down
	'change .__param, click .__param, pointerdown .__param, pointermove .__param': function (e, t) {
		var slider = $(e.currentTarget);
		var param = slider.data('param');
		var value = slider.val();
		var result = PaintChat.getTool()[param].set(value);

		if (param === 'size') {
			$('#size-value').text(value);
		}

		if (param === 'alpha') {
			$('#opacity-value').text(value);
		}

		if (param === 'hardness') {
			$('#edge-value').text(value);
		}

		if (param === 'flow') {
			$('#flow-value').text(value);
		}

		//console.log("CHANGED", param, value);
		//console.log(PaintChat.getTool());

		//update the preview box
		//todo: remove /100 and move it to brushTool get
		var color = [0, 0, 0],
			flow = (PaintChat.getTool()['flow'].get() / 100),
			opacity = (PaintChat.getTool()['alpha'].get() / 100),
			radius = parseInt(PaintChat.getTool()['size'].get(), 10),
			texture = PaintChat.getTool().getTexture(),
			softness = (1 - (PaintChat.getTool()['hardness'].get() / 100)),
			mode = PictureEvent.Mode.normal,
			w = 256,
			ySteps = 1 / 6;
		var undone = t.preview.undoLatest();
		if (undone) {
			var update = new PictureUpdate('undo');
			update.setUndoEvent(undone.sid, undone.sessionEventId);
			t.preview.pushUpdate(update, false);
		}
		t.preview.display();
		t.event = t.preview.createBrushEvent(color, flow, opacity, radius, texture, softness, mode);
		for (var j = 0; j < 101; ++j) {
			var x = (0.005 * j + 0.2) * w;
			var y = ySteps * w - Math.sin(x / w * Math.PI * 4) * 0.03 * w;
			t.event.pushCoordTriplet(x, y, 1);
		}
		t.pushEvent(t.event);

		if (param === 'size') {
			PaintChat.getTool().setMouseCursor(param, value);
		}
		return result;
	},

	'touchmove #brushSettings': function (e, t) {
		e.stopPropagation();
		//e.preventDefault();
	}

});

Template.brushSettings.onRendered(function () {
	this.drawArea = this.find('#brushPreview');
	this.preview = PaintChat.createPicture('preview', 250, 100);
	PaintChat.attachPicture(this.preview, this.drawArea);
//console.log(this.preview);
	this.pushEvent = function (event) {
		var update = new PictureUpdate('add_picture_event');
		update.setPictureEvent(0, event);
		this.preview.pushUpdate(update);
		this.preview.display();
	};

	var color = [0, 0, 0],
		flow = (PaintChat.getTool().getFlow() / 100),
		opacity = (PaintChat.getTool().getAlpha() / 100),
		radius = PaintChat.getTool().getSize(),
		texture = PaintChat.getTool().getTexture(),
		softness = (1 - (PaintChat.getTool().getHardness() / 100)),
		mode = PictureEvent.Mode.normal,
		w = 256,
		ySteps = 1 / 6;

	$('#size-value').text(radius);

	$('#opacity-value').text(opacity * 100);

	$('#edge-value').text((1 + softness) * 100);

	$('#flow-value').text(flow * 100);

	this.event = this.preview.createBrushEvent(color, flow, opacity, radius, texture, softness, mode);
	for (var j = 0; j < 101; ++j) {
		var x = (0.005 * j + 0.2) * w;
		var y = ySteps * w - Math.sin(x / w * Math.PI * 4) * 0.03 * w;
		this.event.pushCoordTriplet(x, y, 1);
	}
	//console.log(this.event);
	this.pushEvent(this.event);


});

Template.brushSettings.onCreated(function () {

});


