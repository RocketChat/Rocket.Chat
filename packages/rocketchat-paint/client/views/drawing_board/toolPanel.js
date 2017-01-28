/**
 * Created by khurrum on 1/29/16.
 */

Template.toolPanel.onRendered(function () {
	$("#colorPicker").spectrum({
		flat: true,
		//showAlpha: true,
		color: PaintChat.foregroundColor.getRGBString(),
		showButtons: false,
		className: "full-spectrum",
		preferredFormat: "rgb",
		move: function (color) {

			PaintChat.foregroundColor.setColor([Math.round(color._r), Math.round(color._g), Math.round(color._b)]);
		},
		show: function () {

		},
		hide: function () {

		},
		change: function (color) {

		},
	});
});
