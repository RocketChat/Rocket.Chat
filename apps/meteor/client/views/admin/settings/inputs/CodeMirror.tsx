import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useEffect, useRef, useState } from 'react';

const defaultGutters = ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'];

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
	value: valueProp,
	defaultValue,
	onChange,
	...props
}: CodeMirrorProps): ReactElement {
	const [value, setValue] = useState(valueProp || defaultValue);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const editorRef = useRef<HTMLFormElement | null>(null);
	const handleChange = useMutableCallback(onChange);

	useEffect(() => {
		if (editorRef.current) {
			return;
		}

		const setupCodeMirror = async (): Promise<void> => {
			const jsPath = 'codemirror/lib/codemirror.js';
			const CodeMirror = await import(jsPath);
			await import('../../../../../app/ui/client/lib/codeMirror/codeMirror');
			const cssPath = 'codemirror/lib/codemirror.css';
			await import(cssPath);

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

			editorRef?.current?.on('change', (doc: HTMLFormElement) => {
				const value = doc.getValue();
				setValue(value);
				handleChange(value);
			});
		};

		setupCodeMirror();

		return (): void => {
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
