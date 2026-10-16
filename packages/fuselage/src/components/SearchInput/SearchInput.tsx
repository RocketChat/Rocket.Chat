import { InputBox, type InputBoxProps } from '../InputBox';

export type SearchInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * An input for search queries.
 */
function SearchInput(props: SearchInputProps) {
	return <InputBox {...props} type='search' />;
}

export default SearchInput;
