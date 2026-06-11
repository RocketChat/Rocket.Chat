import 'katex/dist/katex.css';

type PreviewKatexElementProps = {
	code: string;
};

const PreviewKatexElement = ({ code }: PreviewKatexElementProps) => <>{code}</>;

export default PreviewKatexElement;
