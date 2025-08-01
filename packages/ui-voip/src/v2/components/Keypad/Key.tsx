import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { mergeProps, useLongPress, usePress } from 'react-aria';
import { useTranslation } from 'react-i18next';

type KeyProps = {
	primaryKey: string;
	alternativeKey?: string;
	longPressKey?: string;
	onLongKeyPress: (digit: string) => void;
	onKeyPress: (digit: string) => void;
};

const dialPadButtonClass = css`
	> .rcx-button--content {
		display: flex;
		flex-direction: column;
	}
`;

const Key = ({ primaryKey, alternativeKey, longPressKey, onLongKeyPress, onKeyPress }: KeyProps) => {
	const { t } = useTranslation();

	const { longPressProps } = useLongPress({
		accessibilityDescription: `${t(`Long_press_to_do_x`, { action: longPressKey })}`,
		onLongPress: () => longPressKey && onLongKeyPress(longPressKey),
	});

	const { pressProps } = usePress({
		onPress: () => onKeyPress(primaryKey),
	});

	const buttonProps = longPressKey ? mergeProps(pressProps, longPressProps) : pressProps;

	return (
		<Button minWidth={52} w={52} h={40} p={0} m={4} {...buttonProps} className={dialPadButtonClass}>
			<Box is='span' fontScale='p1' mb={-2}>
				{primaryKey}
			</Box>
			<Box is='span' fontScale='c1' color='hint' aria-hidden mbs={-2} minHeight={16}>
				{alternativeKey}
			</Box>
		</Button>
	);
};

export default Key;
