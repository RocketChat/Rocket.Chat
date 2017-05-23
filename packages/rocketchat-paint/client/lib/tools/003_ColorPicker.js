/**
 * Created by khurrum on 8/18/15.
 */

// #### Color Picker Tool #### //
ColorPicker = function ColorPicker(params) {
	baseTool.call(this, params);
	this.color = new ReactiveVar(params.color);
};

ColorPicker.prototype = Object.create(baseTool.prototype);


_.extend(ColorPicker.prototype, {
	setColor: function (e) {
		return 0
	},
	setMouseCursor: function () {
		var $canvas = $('#__drawingCanvas canvas#drawingBoard');
		$canvas.css('cursor', 'none');
		var $cursorCanvas = $('#cursorCanvas');
		$("#__drawingCanvas").panzoom("option", {
			disablePan: true,
			disableZoom: true,
		});

		//var currentTool = this;

		//var picker = currentTool;
		var canvas = $cursorCanvas[0];
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = "12px FontAwesome";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("\uf1fb", canvas.width / 2, canvas.height / 2);
		var dataURL = canvas.toDataURL('image/png')
		$('.boardArea').css('cursor', 'url(' + dataURL + '), auto');

	},
	toolDown: function (e, drawArea, picture, context) {
		var coords = PaintChat.getRelativeCoords(e, drawArea);
		var pixelData = picture.getPixelRGBA(coords);
		PaintChat.foregroundColor.setColor(pixelData);
		$("#colorPicker").spectrum("set", PaintChat.foregroundColor.getRGBString()); //todo: move this into a Color obj method
		//var canvas = drawArea.childNodes[0];
		//console.log(canvas);
		//var arr = new Uint8Array(1 * 1 * 4);
		//var ctx = canvas.getContext("webgl", {preserveDrawingBuffer: true});
		//var p = ctx.readPixels(coords.x, coords.y, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, arr);
		//console.log(p);
		//console.log(JSON.stringify(arr));
		//PaintChat.foregroundColor.setColor(arr);

	},

	toolUp: function (e, picture) {

		//console.log(e);
	},
	toolMove: function (e, drawArea, picture, context, isMouseDown) {
		var coords = PaintChat.getRelativeCoords(e, drawArea);
		var $cursorCanvas = $('#cursorCanvas');
		$cursorCanvas.css({'left': (coords.x - 1.5), 'top': (coords.y - $cursorCanvas.width() + 1)});
// - $cursorCanvas.width() / 2
		//- $cursorCanvas.width() / 2)
		if (isMouseDown) {
			//var coords = PaintChat.getRelativeCoords(e, drawArea);
			var pixelData = picture.getPixelRGBA(coords);
			PaintChat.foregroundColor.setColor(pixelData);
			$("#colorPicker").spectrum("set", PaintChat.foregroundColor.getRGBString());
		}


		//console.log(e);
	},

});



