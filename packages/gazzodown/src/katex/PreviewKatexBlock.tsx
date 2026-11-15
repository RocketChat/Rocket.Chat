import 'katex/dist/katex.css';

export type PreviewKatexBlockProps = {
	code: string;
};

const PreviewKatexBlock = ({ code }: PreviewKatexBlockProps) => <>{code}</>;

export default PreviewKatexBlock;
