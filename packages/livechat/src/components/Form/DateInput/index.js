import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';

const DateInput = ({ name, value, placeholder, disabled, small, error, onChange, onInput, className, style = {} }) => (
	<input
		type='date'
		name={name}
		value={value}
		placeholder={placeholder}
		disabled={disabled}
		onChange={onChange}
		onInput={onInput}
		className={createClassName(styles, 'date-input', { disabled, error, small }, [className])}
		style={style}
	/>
);

export default memo(DateInput);
