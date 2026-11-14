import type { MessageMarkupProps } from '../MessageRenderersContext';

const textOf = (node: unknown): string => {
	if (typeof node === 'string') {
		return node;
	}
	if (Array.isArray(node)) {
		return node.map(textOf).join('');
	}
	if (node && typeof node === 'object' && 'value' in node) {
		return textOf(node.value);
	}
	return '';
};

/** Shows the source text of a message, or the text of its parsed markdown without one, keeping line breaks; stands in for the markdown renderer. */
const FakeMarkup = ({ md, msg }: MessageMarkupProps) => <span style={{ whiteSpace: 'pre-wrap' }}>{msg ?? textOf(md)}</span>;

export default FakeMarkup;
