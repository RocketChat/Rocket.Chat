import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useRef, useState } from 'react';

const defaultGutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'];

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
	value: valueProp,
	defaultValue,
	onChange,
	...props
}) {
	const [value, setValue] = useState(valueProp || defaultValue);

	const textAreaRef = useRef();
	const editorRef = useRef();
	const handleChange = useMutableCallback(onChange);

	useEffect(() => {
		if (editorRef.current) {
			return;
		}

		const setupCodeMirror = async () => {
			const CodeMirror = await import('codemirror/lib/codemirror.js');
			await import('../../../../../app/ui/client/lib/codeMirror/codeMirror');
			await import('codemirror/lib/codemirror.css');

			if (!textAreaRef.current) {
				return;
			}

			editorRef.current = CodeMirror.fromTextArea(textAreaRef.current, {
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
			});

			editorRef.current.on('change', (doc) => {
				const value = doc.getValue();
				setValue(value);
				handleChange(value);
			});
		};

		setupCodeMirror();

		return () => {
			if (!editorRef.current) {
				return;
			}

			editorRef.current.toTextArea();
		};
	}, [
		autoCloseBrackets,
		foldGutter,
		gutters,
		highlightSelectionMatches,
		lineNumbers,
		lineWrapping,
		matchBrackets,
		matchTags,
		mode,
		handleChange,
		readOnly,
		textAreaRef,
		showTrailingSpace,
	]);

	useEffect(() => {
		setValue(valueProp);
	}, [valueProp]);

	useEffect(() => {
		if (!editorRef.current) {
			return;
		}

		if (value !== editorRef.current.getValue()) {
			editorRef.current.setValue(value);
		}
	}, [textAreaRef, value]);

	return <textarea readOnly ref={textAreaRef} style={{ display: 'none' }} value={value} {...props} />;
}

export default CodeMirror;
