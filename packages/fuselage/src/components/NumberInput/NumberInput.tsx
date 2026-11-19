import { InputBox, type InputBoxProps } from '../InputBox';

export type NumberInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * Takes a number, with the browser's controls to step it up and down.
 */
function NumberInput(props: NumberInputProps) {
	return <InputBox type='number' {...props} />;
}

export default NumberInput;
