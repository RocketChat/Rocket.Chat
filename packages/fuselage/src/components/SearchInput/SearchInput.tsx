import { InputBox, type InputBoxProps } from '../InputBox';

export type SearchInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * Takes the text to search for.
 */
function SearchInput(props: SearchInputProps) {
	return <InputBox type='search' {...props} />;
}

export default SearchInput;
