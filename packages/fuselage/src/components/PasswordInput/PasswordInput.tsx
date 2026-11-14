import { useToggle } from '@rocket.chat/fuselage-hooks';

import { Icon } from '../Icon';
import { InputBox, type InputBoxProps } from '../InputBox';

// TODO: fix a11y issues

export type PasswordInputProps = Omit<InputBoxProps<HTMLInputElement>, 'type'>;

function PasswordInput(props: PasswordInputProps) {
	const [hidden, toggle] = useToggle(true);
	const handleAddonClick = () => {
		toggle();
	};

	return (
		<InputBox
			endAddon={<Icon name={hidden ? 'eye-off' : 'eye'} size={20} onClick={handleAddonClick} />}
			{...props}
			type={hidden ? 'password' : 'text'}
		/>
	);
}

export default PasswordInput;
