/**
 * Created by khurrum on 8/22/15.
 */

// #### Zoom Tool     #### //

ZoomTool = function ZoomTool(params) {
	baseTool.call(this, params);
}

ZoomTool.prototype = Object.create(baseTool.prototype);
_.extend(ZoomTool.prototype, {
	setMouseCursor: function () {
		var $canvas = $('#__drawingCanvas canvas#drawingBoard');
		$canvas.css('cursor', 'zoom-in');

		$("#__drawingCanvas").panzoom("option", {
			disablePan: false,
			disableZoom: false,
		});

		var $cursorCanvas = $('#cursorCanvas');
		var canvas = $cursorCanvas[0];
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	},
	toolDown: function (e, drawArea, picture) {
		this.mouseDown = true;
		this.startCoords = PaintChat.getRelativeCoords(e, drawArea);
	},
	toolMove: function (e, drawArea, picture) {
		var $cursorCanvas = $('#cursorCanvas');
		var coords = PaintChat.getRelativeCoords(e, drawArea);
		$cursorCanvas.css({'left': coords.x, 'top': coords.y});
	},
	toolUp: function (e, drawArea, picture) {
		this.mouseDown = false;
	}


});
