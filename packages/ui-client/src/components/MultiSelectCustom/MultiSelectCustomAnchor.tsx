import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, Palette } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

type MultiSelectCustomAnchorProps = {
	onClick?: (value: boolean) => void;
	collapsed: boolean;
	defaultTitle: TranslationKey;
	selectedOptionsTitle: TranslationKey;
	selectedOptionsCount: number;
	maxCount: number;
} & ComponentProps<typeof Button>;

const MultiSelectCustomAnchor = forwardRef<HTMLElement, MultiSelectCustomAnchorProps>(function MultiSelectCustomAnchor(
	{ onClick, collapsed, selectedOptionsCount, selectedOptionsTitle, defaultTitle, maxCount, ...props },
	ref,
) {
	const t = useTranslation();

	const inputStyle = collapsed
		? css`
				&,
				&:hover,
				&:active,
				&:focus {
					border-color: ${Palette.stroke['stroke-highlight'].toString()};
					border-width: 2px;
					box-shadow: 0 0 0 2px ${Palette.shadow['shadow-highlight'].toString()};
				}
		  `
		: '';

	return (
		<Button
			ref={ref}
			onClick={onClick}
			display='flex'
			justifyContent='space-between'
			flexDirection='row'
			flexGrow='1'
			flexShrink='1'
			borderColor='none'
			borderWidth='x1'
			bg='surface-light'
			h='x40'
			className={inputStyle}
			{...props}
		>
			{selectedOptionsCount > 0 && selectedOptionsCount !== maxCount - 1
				? `${t(selectedOptionsTitle)} (${selectedOptionsCount})`
				: t(defaultTitle)}
			<Box mi='x4' display='flex' alignItems='center' justifyContent='center'>
				<Icon name='chevron-down' fontSize='x20' color='hint' />
			</Box>
		</Button>
	);
});

export default MultiSelectCustomAnchor;
