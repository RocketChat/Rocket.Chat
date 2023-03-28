import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import './codeMirrorComponent.html';

const CodeMirrors: Record<string, unknown> = {};

Template.CodeMirror.onRendered(async function () {
	const CodeMirror = await import('codemirror');

	await import('./codeMirror');
	await import('codemirror/lib/codemirror.css');

	const options = this.data.options || { lineNumbers: true };
	const textarea = this.find('textarea') as HTMLTextAreaElement;
	const editor = CodeMirror.fromTextArea(textarea, options);

	this.autorun((c) => {
		const { code } = Template.currentData();
		if (code === undefined) {
			return;
		}
		c.stop();
		editor.setValue(code);
	});

	CodeMirrors[this.data.id || 'code-mirror-textarea'] = editor;
	if (this.data?.editorOnBlur) {
		this.data.editorOnBlur(this.data.name);
	}

	editor.on('change', (doc) => {
		const val = doc.getValue();
		textarea.value = val;
		if (this.data.reactiveVar) {
			Session.set(this.data.reactiveVar, val);
		}
	});

	if (this.data.reactiveVar) {
		this.autorun(() => {
			const val = Session.get(this.data.reactiveVar) || '';
			if (val !== editor.getValue()) {
				editor.setValue(val);
			}
		});
	}

	Meteor.defer(function () {
		editor.refresh();
	});
});

Template.CodeMirror.onDestroyed(function () {
	delete CodeMirrors[this.data.id || 'code-mirror-textarea'];
	this.$(`#${this.data.id || 'code-mirror-textarea'}`)
		.next('.CodeMirror')
		.remove();
});

Template.CodeMirror.helpers({
	editorId() {
		return this.id || 'code-mirror-textarea';
	},

	editorName() {
		return this.name || 'code-mirror-textarea';
	},
});
