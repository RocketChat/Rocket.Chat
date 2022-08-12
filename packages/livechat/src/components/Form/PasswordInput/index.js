import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';


export const PasswordInput = memo(({
	name,
	value,
	placeholder,
	disabled,
	small,
	error,
	onChange,
	onInput,
	className,
	style = {},
}) => (
	<input
		type='password'
		name={name}
		value={value}
		placeholder={placeholder}
		disabled={disabled}
		onChange={onChange}
		onInput={onInput}
		className={createClassName(styles, 'password-input', { disabled, error, small }, [className])}
		style={style}
	/>
));
