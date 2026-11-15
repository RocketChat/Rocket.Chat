import { InputBox, type InputBoxProps } from '../InputBox';

export type NumberInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * An input for numbers.
 */
function NumberInput(props: NumberInputProps) {
	return <InputBox type='number' {...props} />;
}

export default NumberInput;
