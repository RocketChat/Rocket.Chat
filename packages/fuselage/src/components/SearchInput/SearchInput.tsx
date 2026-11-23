import { InputBox, type InputBoxProps } from '../InputBox/index.js';

export type SearchInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

/**
 * An input for search queries.
 */
function SearchInput(props: SearchInputProps) {
	return <InputBox type='search' {...props} />;
}

export default SearchInput;
