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
			type={hidden ? 'password' : 'text'}
			endAddon={<Icon name={hidden ? 'eye-off' : 'eye'} size={20} onClick={handleAddonClick} />}
			{...props}
		/>
	);
}

export default PasswordInput;
