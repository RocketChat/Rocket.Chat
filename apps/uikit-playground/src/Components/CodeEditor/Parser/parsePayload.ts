import type { EditorView } from 'codemirror';

const parsePayload = (head: { from: number; to: number }, view: EditorView) => {
	JSON.parse(view.state.doc.toString().slice(head.from, head.to));
};

export default parsePayload;
