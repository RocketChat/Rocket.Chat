/* global CodeMirrors */
CodeMirrors = {};

import 'codemirror/lib/codemirror.css';
import CodeMirror from 'codemirror/lib/codemirror.js';

Template.CodeMirror.rendered = function() {
	var options = this.data.options || { lineNumbers: true };
	var textarea = this.find('textarea');
	var editor = CodeMirror.fromTextArea(textarea, options);

	CodeMirrors[this.data.id || 'code-mirror-textarea'] = editor;

	var self = this;
	editor.on('change', function(doc) {
		var val = doc.getValue();
		textarea.value = val;
		if (self.data.reactiveVar) {
			Session.set(self.data.reactiveVar, val);
		}
	});

	if (this.data.reactiveVar) {
		this.autorun(function() {
			var val = Session.get(self.data.reactiveVar) || '';
			if (val !== editor.getValue()) {
				editor.setValue(val);
			}
		});
	}

	Meteor.defer(function() {
		editor.refresh();
	});
};

Template.CodeMirror.destroyed = function() {
	delete CodeMirrors[this.data.id || 'code-mirror-textarea'];
	this.$('#' + (this.data.id || 'code-mirror-textarea')).next('.CodeMirror').remove();
};

Template.CodeMirror.helpers({
	editorId() {
		return this.id || 'code-mirror-textarea';
	},

	editorName() {
		return this.name || 'code-mirror-textarea';
	}
});
