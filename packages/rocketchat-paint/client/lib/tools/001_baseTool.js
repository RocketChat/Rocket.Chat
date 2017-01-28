baseTool = function (params) {
	//console.log('baseTool Params:' + params);
	this.name = new ReactiveVar(params.name || "Generic Tool");
	this.type = new ReactiveVar(params.type || "Generic Type");
	this.iconName = new ReactiveVar(params.iconName || "fa-generic"); //todo: change to generic tool icon
	this.index = new ReactiveVar(0);
	this.settingsTemplate = params.settingsTemplate;
};

baseTool.prototype = {
	getName: function () {
		return this.name.get();
	},
	getIconName: function () {
		return this.iconName.get();
	},
	getType: function () {
		return this.type.get();
	},
	setMouseCursor: function () {
		return 0;
	},
	getSettingsTemplate: function () {
		return this.settingsTemplate;
	},
	setSettingsTemplate: function () {
		Session.set('settingsTemplate', this.settingsTemplate)
	},
	cursorMove: function (e) {
		return 0
	},
	//setActiveTool: function(){ return 0 },
	toolDown: function (e, drawArea, picture) {
		return 0
	},
	toolUp: function (e, drawArea, picture) {
		return 0
	},
	toolOut: function (e, drawArea, picture) {
		return 0
	},
	toolMove: function (e, drawArea, picture) {
		return 0
	},
	toolDrag: function (e, drawArea, picture) {
		return 0
	},
	keyDown: function (e) {
		return 0
	},
};


