/**
 * Created by khurrum on 8/22/15.
 */

// #### Pan Move Tool #### //

PanMoveTool = function PanMoveTool(params) {
	baseTool.call(this, params);
	this.startCoords = {};
	this.mouseDown = false;
}

PanMoveTool.prototype = Object.create(baseTool.prototype);

_.extend(PanMoveTool.prototype, {
	setMouseCursor: function () {
		var $canvas = $('#__drawingCanvas canvas#drawingBoard');
		$canvas.css('cursor', 'move');

		$("#__drawingCanvas").panzoom("enable");
		//console.log("panZoom enable");


		var $cursorCanvas = $('#cursorCanvas');
		var canvas = $cursorCanvas[0];
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	},
	toolDown: function (e, drawArea, picture) {

		this.mouseDown = true;
		this.startCoords = PaintChat.getRelativeCoords(e, drawArea);
		this.startTop = drawArea.style.top;
		this.startLeft = drawArea.style.left;

	},
	toolMove: function (e, drawArea, picture) {
		var $cursorCanvas = $('#cursorCanvas');
		var coords = PaintChat.getRelativeCoords(e, drawArea);


		$cursorCanvas.css({'left': coords.x, 'top': coords.y});
		if (this.currentEvent !== null && this.mouseDown === true) {
			var jDrawArea = $(drawArea);
			var deltaX = coords.x - this.startCoords.x;
			var deltaY = coords.y - this.startCoords.y;
			jDrawArea.css('top', '+=' + deltaY);
			jDrawArea.css('left', '+=' + deltaX);
		}

	},
	toolUp: function (e, drawArea, picture) {
		this.mouseDown = false;
	}


});
