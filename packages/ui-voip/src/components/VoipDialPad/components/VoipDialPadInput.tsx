import { css } from '@rocket.chat/css-in-js';
import { IconButton, TextInput } from '@rocket.chat/fuselage';
import type { FocusEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

type DialPadInputProps = {
	value: string;
	readOnly?: boolean;
	onBackpaceClick?: () => void;
	onChange: (e: FormEvent<HTMLInputElement>) => void;
	onBlur?: (event: FocusEvent<HTMLElement, Element>) => void;
};

const className = css`
	padding-block: 6px;
	min-height: 28px;
	height: 28px;
`;

const VoipDialPadInput = ({ readOnly, value, onChange, onBackpaceClick }: DialPadInputProps) => {
	const { t } = useTranslation();

	return (
		<TextInput
			p={0}
			readOnly={readOnly}
			height='100%'
			minHeight={0}
			value={value}
			className={className}
			aria-label={t('Phone_number')}
			addon={
				<IconButton
					small
					icon='backspace'
					aria-label={t('Remove_last_character')}
					data-testid='dial-paid-input-backspace'
					size='14px'
					disabled={!value}
					onClick={onBackpaceClick}
				/>
			}
			onChange={onChange}
		/>
	);
};

export default VoipDialPadInput;
