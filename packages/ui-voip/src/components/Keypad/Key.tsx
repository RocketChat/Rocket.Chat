import { useLongPress, usePress } from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, useStyle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type KeyProps = {
	primaryKey: string;
	alternativeKey?: string;
	longPressKey?: string;
	onLongKeyPress: (digit: string) => void;
	onKeyPress: (digit: string) => void;
	large?: boolean;
};

const dialPadButtonClass = css`
	min-width: 3.25rem;
	width: 3.25rem;
	height: 2.5rem;
	padding: 0;
	border-radius: 0.5rem;

	> .rcx-button--content {
		display: flex;
		flex-direction: column;
	}
`;

const Key = ({ primaryKey, alternativeKey, longPressKey, onLongKeyPress, onKeyPress, large }: KeyProps) => {
	const { t } = useTranslation();
	const dialPadButtonClassName = useStyle(dialPadButtonClass);

	const { longPressProps } = useLongPress({
		accessibilityDescription: `${t(`Long_press_to_do_x`, { action: longPressKey })}`,
		onLongPress: () => longPressKey && onLongKeyPress(longPressKey),
	});

	const { pressProps } = usePress({ onPress: () => onKeyPress(primaryKey) });

	const buttonProps = longPressKey ? mergeProps(pressProps, longPressProps) : pressProps;

	return (
		<Button {...buttonProps} className={dialPadButtonClassName}>
			<Box is='span' fontScale={large ? 'h1' : 'p1'} fontWeight={large ? 300 : 400} marginBlock={-4}>
				{primaryKey}
			</Box>
			<Box is='span' fontScale='c1' color='hint' aria-hidden minHeight={16} letterSpacing='0.15em'>
				{alternativeKey}
			</Box>
		</Button>
	);
};

export default Key;
