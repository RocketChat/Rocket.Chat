import DOMPurify from 'dompurify';

/** @deprecated */
const RawText = ({ children }: { children: string }) => <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(children) }} />;

export default RawText;
