import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

type MultiSelectCustomAnchorProps = {
	collapsed: boolean;
	defaultTitle: TranslationKey;
	selectedOptionsTitle: TranslationKey;
	selectedOptionsCount: number;
	maxCount: number;
} & ComponentProps<typeof Box>;

const MultiSelectCustomAnchor = forwardRef<HTMLElement, MultiSelectCustomAnchorProps>(function MultiSelectCustomAnchor(
	{ collapsed, selectedOptionsCount, selectedOptionsTitle, defaultTitle, maxCount, ...props },
	ref,
) {
	const t = useTranslation();
	const customStyle = css`
		&:hover {
			cursor: pointer;
		}
	`;
	const isDirty = selectedOptionsCount > 0 && selectedOptionsCount !== maxCount - 1;

	return (
		<Box
			is='button'
			ref={ref}
			role='button'
			tabIndex={0}
			display='flex'
			justifyContent='space-between'
			alignItems='center'
			h='x40'
			className={['rcx-input-box__wrapper', customStyle].filter(Boolean)}
			w='full'
			pb={10}
			pi={16}
			color={isDirty ? Palette.text['font-default'].toString() : Palette.text['font-annotation'].toString()}
			rcx-input-box
			{...props}
		>
			{isDirty ? `${t(selectedOptionsTitle)} (${selectedOptionsCount})` : t(defaultTitle)}
			<Icon name={collapsed ? 'chevron-up' : 'chevron-down'} fontSize='x20' color='hint' />
		</Box>
	);
});

export default MultiSelectCustomAnchor;
