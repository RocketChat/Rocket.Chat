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
					cursor: pointer;
					border-color: ${Palette.stroke['stroke-highlight'].toString()}!important;
					box-shadow: 0 0 0 2px ${Palette.shadow['shadow-highlight'].toString()};
				}
		  `
		: css`
				& {
					cursor: pointer;
				}
		  `;

	const isDirty = selectedOptionsCount > 0 && selectedOptionsCount !== maxCount - 1;

	return (
		<Box
			ref={ref}
			role='button'
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => (e.code === 'Enter' || e.code === 'Space') && onClick}
			display='flex'
			justifyContent='space-between'
			alignItems='center'
			flexDirection='row'
			borderColor={Palette.stroke['stroke-light'].toString()}
			borderWidth='x1'
			borderRadius={4}
			bg={Palette.surface['surface-light'].toString()}
			h='x40'
			w='full'
			pb={10}
			pi={16}
			color={isDirty ? Palette.text['font-default'].toString() : Palette.text['font-annotation'].toString()}
			className={inputStyle}
			{...props}
		>
			{isDirty ? `${t(selectedOptionsTitle)} (${selectedOptionsCount})` : t(defaultTitle)}
			<Icon name='chevron-down' fontSize='x20' color='hint' />
		</Box>
	);
});

export default MultiSelectCustomAnchor;
