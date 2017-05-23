/**
 * Created by khurrum on 1/17/16.
 */
Template.roomButtons.onRendered(function () {
	$("#colorPicker").spectrum({
		flat: false,
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

Template.roomButtons.helpers({
	tool_icon: function () {
		return PaintChat.getTool(this).getIconName();
	},

	activeIf: function (a, b, active) {
		if (a == b) return _.isString(active) ? active : '_active';
		return '';
	},

	tool_name: function () {
		return PaintChat.getTool(this).getName();
	},

	brush: function () {
		return PaintChat.getTool(this);
	},

	brushIdxes: function () {
		return _.range(PaintChat.tools.count.get());
	},

	selectedBrushIndex: function () {
		return PaintChat.tools.index.get();
	},

	displaySettingsIcon: function () {
		var tool = PaintChat.getTool(this);
		return tool.settingsTemplate && tool.index.get() == PaintChat.tools.index.get();
	},

	typeIs: function (value) {
		//return PaintChat.getTool(this).type.get() === value;
		return PaintChat.getTool(this).getType() === value;
	},

	selectedIf: function (brush, prop, val) {
		return (PaintChat.getTool(brush).get(prop) === val) ? '_selected' : '';
	},

	zoomLevelLabel: function () {
		var level = PaintChat.zoom.level.get() * 200;
		return (Math.round(level)) + '%';
	},

	canClear: function () {
		return RocketChat.authz.hasRole(Meteor.userId(), ["admin", "moderator"], this.rid);
	}
});

Template.roomButtons.events({
	'click ._selected': function (e, t) {
		if (PaintChat.tools.list[PaintChat.tools.index.get()].settingsTemplate) {
			$('#slider').toggleClass("slide-in");
		}
	},

	'click .saveToCloud': function (e, t) {
		//console.log('Save to Cloud');
		var name = Session.get('openedRoom') + Date.now();
		PaintChat.Picture.toBlob(function (x) {
			//console.log(x);
			fileUpload([{file: x, name: name}]);
		});
	},

	'click .clearBoard': function (e, template) {
		swal({
				title: t('Are_you_sure'),
				showCancelButton: true
			}
			, function (isConfirm) {
				if (isConfirm) {
					Meteor.call('clearStrokes', template.data.rid, function (error, result) {
						//console.log('error' + error);
						//console.log('result' + result);
					});
				}
			});
	},

	'click .__brush': function (e, t) {
		var button = $(e.currentTarget);
		var currentTool = PaintChat.tools.list[button.data('index')];
		PaintChat.currentTool = currentTool;
		currentTool.setSettingsTemplate();


		if (PaintChat.tools.index.curValue !== Number(button.data('index'))) {
			var index = Number(button.data('index'));
			PaintChat.tools.index.set(Number(button.data('index')));
			currentTool.setMouseCursor();
			$('#slider').removeClass("slide-in");
		}

		t.$('.__brush').removeClass('_active');
		button.addClass('_active');
	},

	'click ._ico': function (e, t) {

		var bid = $(e.target).closest('._button').data('index');
		var prop = $(e.target).closest('._line').data('for');

		// Wee want to convert the context value from object (used by handlebars) to a plain type
		if (prop === 'size')
			PaintChat.getTool(bid).set(prop, 0 + this);
		else
			PaintChat.getTool(bid).set(prop, '' + this);

		_.defer(function () {
			t.$('.__brush').removeClass('_active');
		});
	},


});



