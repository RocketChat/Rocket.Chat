import { useToggle } from '@rocket.chat/fuselage-hooks';

import { IconButton } from '../Button';
import { InputBox, type InputBoxProps } from '../InputBox';

export type PasswordInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'> & {
	showPasswordLabel?: string;
	hidePasswordLabel?: string;
};

function PasswordInput({ showPasswordLabel = 'Show password', hidePasswordLabel = 'Hide password', ...props }: PasswordInputProps) {
	const [hidden, toggle] = useToggle(true);
	const handleAddonClick = () => {
		toggle();
	};

	return (
		<InputBox
			type={hidden ? 'password' : 'text'}
			endAddon={
				<IconButton
					mini
					type='button'
					disabled={props.disabled}
					icon={hidden ? 'eye-off' : 'eye'}
					aria-label={hidden ? showPasswordLabel : hidePasswordLabel}
					onClick={handleAddonClick}
				/>
			}
			{...props}
		/>
	);
}

export default PasswordInput;
