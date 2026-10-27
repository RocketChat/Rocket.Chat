import { InputBox, type InputBoxProps } from '../InputBox';

export type UrlInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

function UrlInput(props: UrlInputProps) {
	return <InputBox type='url' {...props} />;
}

export default UrlInput;
