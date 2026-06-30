import 'katex/dist/katex.css';

type PreviewKatexBlockProps = {
	code: string;
};

const PreviewKatexBlock = ({ code }: PreviewKatexBlockProps) => <>{code}</>;

export default PreviewKatexBlock;
