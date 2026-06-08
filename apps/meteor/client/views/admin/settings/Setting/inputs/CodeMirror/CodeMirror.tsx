import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useThemeMode } from '@rocket.chat/ui-theming';
import type { Editor, EditorFromTextArea } from 'codemirror';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
	const [, , resolvedTheme] = useThemeMode();

	const codeMirrorTheme = useMemo(() => {
		if (resolvedTheme === 'dark' || resolvedTheme === 'high-contrast') {
			return 'base16-dark';
		}

		return 'default';
	}, [resolvedTheme]);
	const [value, setValue] = useState(valueProp || defaultValue);
	const handleChange = useEffectEvent(onChange);

	const editorRef = useRef<EditorFromTextArea | null>(null);
	const themeRef = useRef(codeMirrorTheme);
	const [editorReady, setEditorReady] = useState(false);

	const ensureThemeStyle = useCallback((theme: string) => {
		if (theme === 'base16-dark') {
			return import('codemirror/theme/base16-dark.css');
		}

		return Promise.resolve();
	}, []);

	useEffect(() => {
		themeRef.current = codeMirrorTheme;
	}, [codeMirrorTheme]);
	const textAreaRef = useCallback(
		async (node: HTMLTextAreaElement | null) => {
			if (!node) return;
			setEditorReady(false);

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

				const latestTheme = themeRef.current;
				let themeLoaded = false;
				try {
					await ensureThemeStyle(latestTheme);
					themeLoaded = true;
				} catch (error) {
					console.error('Failed to load CodeMirror theme CSS during init:', error);
				}

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
					theme: themeLoaded ? latestTheme : undefined,
				});
				setEditorReady(true);

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

	useEffect(() => {
		if (!editorRef.current) {
			return;
		}

		const applyTheme = async (): Promise<void> => {
			try {
				await ensureThemeStyle(codeMirrorTheme);
				editorRef.current?.setOption('theme', codeMirrorTheme);
			} catch (error) {
				console.error('Failed to load CodeMirror theme CSS:', error);
			}
		};

		void applyTheme();
	}, [codeMirrorTheme, ensureThemeStyle, editorReady]);

	return <textarea readOnly ref={textAreaRef} style={{ display: 'none' }} value={value} {...props} />;
}

export default CodeMirror;
