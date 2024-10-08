import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { mergeProps, useLongPress, usePress } from 'react-aria';
import { useTranslation } from 'react-i18next';

type DialPadButtonProps = {
	digit: string;
	subDigit?: string;
	longPressDigit?: string;
	onClick: (digit: string) => void;
};

const dialPadButtonClass = css`
	width: 52px;
	height: 40px;
	min-width: 52px;
	padding: 4px;

	> .rcx-button--content {
		display: flex;
		flex-direction: column;
	}
`;

const VoipDialPadButton = ({ digit, subDigit, longPressDigit, onClick }: DialPadButtonProps) => {
	const { t } = useTranslation();

	const { longPressProps } = useLongPress({
		accessibilityDescription: `${t(`Long_press_to_do_x`, { action: longPressDigit })}`,
		onLongPress: () => longPressDigit && onClick(longPressDigit),
	});

	const { pressProps } = usePress({
		onPress: () => onClick(digit),
	});

	return (
		<Button className={dialPadButtonClass} {...mergeProps(pressProps, longPressProps)} data-testid={`dial-pad-button-${digit}`}>
			<Box is='span' fontSize={16} lineHeight={16}>
				{digit}
			</Box>
			<Box is='span' fontSize={12} lineHeight={12} mbs={4} color='hint' aria-hidden>
				{subDigit}
			</Box>
		</Button>
	);
};

export default VoipDialPadButton;
