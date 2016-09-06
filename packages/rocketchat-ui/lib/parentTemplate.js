/**
 * Get the parent template instance
 * @param {Number} [levels] How many levels to go up. Default is 1
 * @returns {Blaze.TemplateInstance}
 */

Blaze.TemplateInstance.prototype.parentTemplate = function(levels) {
	var view = Blaze.currentView;
	if (typeof levels === 'undefined') {
		levels = 1;
	}
	while (view) {
		if (view.name.substring(0, 9) === 'Template.' && !(levels--)) {
			return view.templateInstance();
		}
		view = view.parentView;
	}
};
