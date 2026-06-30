import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { Editor, EditorConfiguration, EditorFromTextArea } from 'codemirror';
import { useEffect, useRef, useState } from 'react';

const defaultGutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'];

type CodeMirrorModule = typeof import('codemirror');

let codeMirrorPromise: Promise<CodeMirrorModule> | undefined;

const loadCodeMirror = (): Promise<CodeMirrorModule> => {
	if (!codeMirrorPromise) {
		codeMirrorPromise = Promise.all([
			import('codemirror'),
			import('../../../../../../../app/ui/client/lib/codeMirror/codeMirror'),
			import('codemirror/addon/edit/matchbrackets'),
			import('codemirror/addon/edit/closebrackets'),
			import('codemirror/addon/edit/matchtags'),
			import('codemirror/addon/edit/trailingspace'),
			import('codemirror/addon/search/match-highlighter'),
			import('codemirror/lib/codemirror.css'),
		]).then(([cm]) => (cm as unknown as { default: CodeMirrorModule }).default ?? cm);
	}
	return codeMirrorPromise;
};

type CodeMirrorProps = {
	id: string;
	placeholder?: string;
	disabled?: boolean;
	autoComplete?: string | undefined;
	lineNumbers?: boolean;
	lineWrapping?: boolean;
	mode?: string;
	gutters?: string[];
	foldGutter?: boolean;
	matchBrackets?: boolean;
	autoCloseBrackets?: boolean;
	matchTags?: boolean;
	showTrailingSpace?: boolean;
	highlightSelectionMatches?: boolean;
	readOnly: boolean;
	value: string;
	defaultValue?: string;
	onChange: (value: string) => void;
};

function CodeMirror({
	lineNumbers = true,
	lineWrapping = true,
	mode = 'javascript',
	gutters = defaultGutters,
	foldGutter = true,
	matchBrackets = true,
	autoCloseBrackets = true,
	matchTags = true,
	showTrailingSpace = true,
	highlightSelectionMatches = true,
	readOnly,
	value,
	defaultValue,
	onChange,
	...props
}: CodeMirrorProps) {
	const handleChange = useStableCallback(onChange);

	const [textArea, setTextArea] = useState<HTMLTextAreaElement | null>(null);
	const [codeMirror, setCodeMirror] = useState<CodeMirrorModule | null>(null);
	const editorRef = useRef<EditorFromTextArea | null>(null);

	// Latest-prop refs read by the init effect without forcing it to re-run.
	const initialValueRef = useRef(value ?? defaultValue ?? '');
	const optionsRef = useRef<EditorConfiguration>({});
	optionsRef.current = {
		lineNumbers,
		lineWrapping,
		mode,
		gutters,
		foldGutter,
		matchBrackets,
		autoCloseBrackets,
		matchTags,
		showTrailingSpace,
		highlightSelectionMatches,
		readOnly,
	};

	useEffect(() => {
		let cancelled = false;
		loadCodeMirror()
			.then((mod) => {
				if (!cancelled) setCodeMirror(() => mod);
			})
			.catch((error) => {
				console.error('CodeMirror initialization failed:', error);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!textArea || !codeMirror) return;

		const editor = codeMirror.fromTextArea(textArea, optionsRef.current);
		editor.setValue(initialValueRef.current);
		editorRef.current = editor;

		const handleEditorChange = (doc: Editor) => {
			handleChange(doc.getValue());
		};
		editor.on('change', handleEditorChange);

		return () => {
			editor.off('change', handleEditorChange);
			editor.toTextArea();
			editorRef.current = null;
		};
	}, [textArea, codeMirror, handleChange]);

	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;
		editor.setOption('lineNumbers', lineNumbers);
		editor.setOption('lineWrapping', lineWrapping);
		editor.setOption('mode', mode);
		editor.setOption('gutters', gutters);
		editor.setOption('foldGutter', foldGutter);
		editor.setOption('matchBrackets', matchBrackets);
		editor.setOption('autoCloseBrackets', autoCloseBrackets);
		editor.setOption('matchTags', matchTags);
		editor.setOption('showTrailingSpace', showTrailingSpace);
		editor.setOption('highlightSelectionMatches', highlightSelectionMatches);
		editor.setOption('readOnly', readOnly);
	}, [
		lineNumbers,
		lineWrapping,
		mode,
		gutters,
		foldGutter,
		matchBrackets,
		autoCloseBrackets,
		matchTags,
		showTrailingSpace,
		highlightSelectionMatches,
		readOnly,
	]);

	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;
		const next = value ?? '';
		if (editor.getValue() !== next) {
			editor.setValue(next);
		}
	}, [value]);

	return <textarea readOnly ref={setTextArea} style={{ display: 'none' }} {...props} />;
}

export default CodeMirror;
