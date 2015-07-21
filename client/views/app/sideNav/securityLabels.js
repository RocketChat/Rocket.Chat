/**
 * Template displays modifiable Classification, SAP, SCI, and Release Caveat security label UI.
 * - Classification is a single select, SAP, SCI, Release Caveat are multiple select.
 * - Uses JQuery 'chosen' plugin to generate UI elements.  Single selects are regular
 *   drop downs, but multiple selects show selections as "tags".
 * - Template renders UI as regular HTML select elements then runs JQuery chosen plugin
 *   during onRendered Meteor callback.  Plugin hides regular select boxes and inserts its
 *   own custom UI.
 * - Plugin generates selection change events that are propagated to parent template via
 *   callbacks.
 * - Make an label required by adding its id to both the selected AND disabled list.
 * - Template expects data context with the following:
 *   1. securityLabels  - array of access permission objects (classification, sap, sci)
 *   2. onSelectionChanged(params) - callback function executed when the user selects/deselects
 *      a security label.  params.selected contains new selection.  params.deselected contains
 *      deselected labels.
 *   3. isOptionSelected(id) - callback function that determines if the label with id is currently
 *      selected.  Use this callback to pre-select security labels.  e.g. when your're editing
 *      a conversation's security labels.
 *   4. isOptionDisabled(id) - callback function that determines if the label with id is currently
 *      disabled.  Use this callback to disabled security label selection.
 */

var classification = { type: 'classification'};
var sap = { type: 'SAP'};
var sci = { type: 'SCI'};
var releaseCaveat = { type: 'Release Caveat'};
Template.securityLabels.onCreated( function() {
	var self = this;

	/**
	 * Retrieve security labels of the specified type.
	 * @param  {string} type equality based on type property
	 * @return {[object]} Array of security labels of the specified type.
	 */
	this.getLabels = function(type) {
		return _.filter(this.data.securityLabels, function(label) {
			return label.type === type;
		});
	};
	/**
	 * Listens for JQuery 'chosen' plugin events fired when the user selects/deselects security labels.
	 * Executes parent template callback function to notify of selection change event.
	 * @param  {Object} event  describes the change event
	 * @param  {object} params selected/deselected value
	 */
	this.labelSelectionChanged = function(event, params ) {
		// JQuery plugin triggers selection change events, but doesn't fire deselection
		// for single select fields (e.g. Classification).  So we check if it's a single select
		// and fire deselect
		if( !this.multiple ) {
			// kludge, but easier to deselect other options than to remember what was selected
			_.each($(this.options), function( option ){
				self.data.onSelectionChanged({deselected : option.value });
			});
		}
		self.data.onSelectionChanged(params);
	}

});

Template.securityLabels.helpers( {
	/**
	 * Determine if the security label is selected or not.
	 * @return {Boolean} 'selected' if label is selected.  Otherwise ''
	 */
	optionSelected: function() {
		return Template.instance().data.isOptionSelected(this._id) ? 'selected' : '';
	},
	/**
	 * Determine if the security label is disabled or not.
	 * @return {Boolean} 'disabled' if label is disabled.  Otherwise ''
	 */
	optionDisabled: function() {
		return Template.instance().data.isOptionDisabled(this._id) ? 'disabled' : '';
	},
	isRelabeling : function(permisstionType) {
		var bVal = false;
		if (Template.instance().data.isRelabeling ) {
			bVal = true;
			if (permisstionType==='C') {
				// TODO: determine if classification is less then the current one
			}
		}
		return bVal ? 'disabled' : '';
	},
	/**
	 * Retrieve allowed classification label choices.  Only the classification(s) that all members have in
	 * common  are returned.
	 * @return {[object]} represents allowed classification label choices
	 */
	classificationLabels : function() {
		return _.sortBy(Template.instance().getLabels(classification.type), 'label');
	},

	/**
	 * Retrieve allowed SAP label choices.  Only the SAP(s) that all members have in
	 * common  are returned.
	 * @return {[object]} represents allowed SAP label choices
	 */
	sapLabels: function() {
		return _.sortBy(Template.instance().getLabels(sap.type), 'label');
	},
	/**
	 * Retrieve allowed SCI label choices.  Only the SCI(s) that all members have in
	 * common  are returned.
	 * @return {[object]} represents allowed SCI label choices
	 */
	sciLabels: function() {
		return _.sortBy(Template.instance().getLabels(sci.type), 'label');
	},
	/**
	 * Retrieve allowed Release Caveat label choices.  Only the Release Caveat(s) that all members have in
	 * common  are returned.
	 * @return {[object]} represents allowed Release Caveat label choices
	 */
	releaseCaveatLabels: function() {
		return _.sortBy(Template.instance().getLabels(releaseCaveat.type), 'label');
	},
	/**
	 * Reactive value to determine if specified permission type has values.
	 * @param  {string}  type access permission type.
	 * @return {Boolean}      true if there are permissions to display
	 */
	hasOptions: function(type) {
		return Template.instance().getLabels(type).length > 0 ;
	},
	/**
	 * Reactive value used to disable/enable permission type's select box.
	 * @param  {string} type access permission type.  SAP|SCI
	 * @return {string} 'disabled' if no permission options for the specified type. Otherwise empty string
	 */
	selectDisabled : function(type) {
		return Template.instance().getLabels(type).length > 0 ? '' : 'disabled';
	}
});

Template.securityLabels.onRendered( function() {
	// enable jquery plugin, chosen, that converts select boxes into tags
	// see harvesthq.github.io/chosen/options.html
	this.$('.chosen-select').chosen({
		width: '100%',
		display_selected_options : false,
		// placeholder this may be clipped, but if we extend then the
		// input box creates new line before necessary and looks odd
		placeholder_text_multiple : 'optional'
	}).change( Template.instance().labelSelectionChanged );
});
