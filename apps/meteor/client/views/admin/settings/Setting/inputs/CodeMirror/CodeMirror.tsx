import { useEffectEvent, useDarkMode } from '@rocket.chat/fuselage-hooks';
import type { Editor, EditorFromTextArea } from 'codemirror';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
	const handleChange = useEffectEvent(onChange);
	const isDark = useDarkMode();

	const editorRef = useRef<EditorFromTextArea | null>(null);

	// Capture initial theme once
	const initialThemeRef = useRef(
		isDark ? 'material-darker' : 'default',
	);

	const textAreaRef = useCallback(
		async (node: HTMLTextAreaElement | null) => {
			if (!node) return;

			try {
				const { default: CodeMirror } = await import('codemirror');

				await Promise.all([
					import('../../../../../../../app/ui/client/lib/codeMirror/codeMirror'),
					import('codemirror/addon/edit/matchbrackets'),
					import('codemirror/addon/edit/closebrackets'),
					import('codemirror/addon/edit/matchtags'),
					import('codemirror/addon/edit/trailingspace'),
					import('codemirror/addon/search/match-highlighter'),
					import('codemirror/lib/codemirror.css'),
					import('codemirror/theme/material-darker.css'), // added
				]);

				editorRef.current = CodeMirror.fromTextArea(node, {
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
					theme: initialThemeRef.current, // added
				});

				editorRef.current.on('change', (doc: Editor) => {
					const newValue = doc.getValue();
					setValue(newValue);
					handleChange(newValue);
				});
			} catch (error) {
				console.error('CodeMirror initialization failed:', error);
			}
		},
		[
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
			showTrailingSpace,
		],
	);

	// Sync external value → state
	useEffect(() => {
		setValue(valueProp);
	}, [valueProp]);

	// Sync state → editor
	useEffect(() => {
		if (!editorRef.current) return;

		if (value !== editorRef.current.getValue()) {
			editorRef.current.setValue(value ?? '');
		}
	}, [value]);

	// Update theme dynamically (no re-init)
	useEffect(() => {
		if (!editorRef.current) return;

		editorRef.current.setOption(
			'theme',
			isDark ? 'material-darker' : 'default',
		);
	}, [isDark]);

	
	useEffect(() => {
		return () => {
			if (editorRef.current) {
				editorRef.current.toTextArea();
				editorRef.current = null;
			}
		};
	}, []);

	return (
		<textarea
			readOnly
			ref={textAreaRef}
			style={{ display: 'none' }}
			value={value}
			{...props}
		/>
	);
}

export default CodeMirror;
