import type { MessagePreviewMarkupProps } from '../MessageRenderersContext';

const FakePreviewMarkup = ({ message }: MessagePreviewMarkupProps) => <>{message.msg}</>;

export default FakePreviewMarkup;
