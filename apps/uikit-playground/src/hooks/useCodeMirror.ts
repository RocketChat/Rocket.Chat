import { EditorState, Annotation } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView } from 'codemirror';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ICodeMirrorChanges = {
	value: string;
	isDispatch: boolean;
	cursor?: number;
};

// Custom annotation to mark programmatic updates
const dispatchAnnotation = Annotation.define<boolean>();

export default function useCodeMirror(extensions: Extension[] = [], doc = '') {
	const view = useRef<EditorView | null>(null);
	const [element, setElement] = useState<HTMLElement | null>(null);

	const [changes, setChanges] = useState<ICodeMirrorChanges>({
		value: doc,
		isDispatch: true,
		cursor: 0,
	});

	// Attach editor to DOM node
	const editor = useCallback((node: HTMLElement | null) => {
		if (node) {
			setElement(node);
		}
	}, []);

	// Listen for updates
	const updateListener = EditorView.updateListener.of((update) => {
		if (!update.docChanged) return;

		const transaction = update.transactions[0];

		const isDispatch = transaction.annotation(dispatchAnnotation) === true;

		setChanges({
			value: update.state.doc.toString(),
			isDispatch,
			cursor: update.state.selection.main.head,
		});
	});

	// Programmatically update editor content
	const setValue = useCallback(
		(
			value: string,
			{
				from = 0,
				to,
				cursor = 0,
			}: {
				from?: number;
				to?: number;
				cursor?: number;
			} = {},
		) => {
			if (!view.current) return;

			try {
				view.current.dispatch({
					changes: {
						from,
						to: to ?? view.current.state.doc.length,
						insert: value ?? '',
					},
					selection: { anchor: cursor },
					annotations: dispatchAnnotation.of(true),
				});
			} catch {
				// silent fail
			}
		},
		[],
	);

	useEffect(() => {
		if (!element) return;

		view.current = new EditorView({
			state: EditorState.create({
				doc,
				extensions: [updateListener, ...extensions],
			}),
			parent: element,
		});

		return () => {
			view.current?.destroy();
			view.current = null;
		};
	}, [element, doc, extensions, updateListener]);

	return { editor, changes, setValue };
}
