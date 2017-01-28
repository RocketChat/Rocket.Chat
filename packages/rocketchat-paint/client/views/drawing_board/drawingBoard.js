Template.drawingBoard.helpers({
	toolSettings: function () {
		return Session.get('settingsTemplate');
	}
});

Template.drawingBoard.events({
	'click .closeSettings': function (e, t) {
		$('#slider').removeClass("slide-in");
		//console.log('.closeSettings');
	}
});

Template.drawingBoard.onRendered(function () {
	//console.log ("drawingBoard Rendered");
	$('.flex-tab').css('max-width', "675px");
	if (PaintChat.drawingCanvas === undefined) {
		PaintChat.drawingCanvas = Blaze.render(Template.drawingCanvas, $('#drawingCanvas')[0]);
	}
});

Template.drawingBoard.onDestroyed(function () {
	//console.log ("drawingBoard Destroyed");
	$('.flex-tab').css('max-width', "");
	PaintChat.drawingCanvas = undefined;
	PaintChat.Strokes.stop();
});

