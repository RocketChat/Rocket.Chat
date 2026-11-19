import { InputBox, type InputBoxProps } from '../InputBox';

export type UrlInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * Takes a web address, and shows as invalid while the value isn't a full URL, scheme included.
 */
function UrlInput(props: UrlInputProps) {
	return <InputBox type='url' {...props} />;
}

export default UrlInput;
