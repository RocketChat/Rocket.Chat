import PlainSpan from '../elements/PlainSpan';

export type CodeElementProps = {
	code: string;
};

const CodeElement = ({ code }: CodeElementProps) => (
	<code className='code-colors inline'>
		<PlainSpan text={code} />
	</code>
);

export default CodeElement;
