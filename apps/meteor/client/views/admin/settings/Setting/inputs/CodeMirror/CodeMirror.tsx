import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
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

	const editorRef = useRef<EditorFromTextArea | null>(null);
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
				});

				editorRef.current.on('change', (doc: Editor) => {
					const newValue = doc.getValue();
					setValue(newValue);
					handleChange(newValue);
				});

				return () => {
					if (node.parentNode) {
						editorRef.current?.toTextArea();
					}
				};
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

	useEffect(() => {
		setValue(valueProp);
	}, [valueProp]);

	useEffect(() => {
		if (!editorRef.current) {
			return;
		}

		if (value !== editorRef.current.getValue()) {
			editorRef.current.setValue(value ?? '');
		}
	}, [textAreaRef, value]);

	return <textarea readOnly ref={textAreaRef} style={{ display: 'none' }} value={value} {...props} />;
}

export default CodeMirror;
