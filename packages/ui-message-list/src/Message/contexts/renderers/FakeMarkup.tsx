import type { MessageMarkupProps } from '../MessageRenderersContext';

/** Shows the source text of a message, keeping its line breaks; stands in for the markdown renderer. */
const FakeMarkup = ({ msg }: MessageMarkupProps) => <span style={{ whiteSpace: 'pre-wrap' }}>{msg}</span>;

export default FakeMarkup;
