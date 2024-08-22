import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

type MultiSelectCustomAnchorProps = {
	collapsed: boolean;
	defaultTitle: string;
	selectedOptionsTitle: string;
	selectedOptionsCount: number;
	maxCount: number;
} & ComponentProps<typeof Box>;

const MultiSelectCustomAnchor = forwardRef<HTMLElement, MultiSelectCustomAnchorProps>(function MultiSelectCustomAnchor(
	{ className, collapsed, selectedOptionsCount, selectedOptionsTitle, defaultTitle, maxCount, ...props },
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
			ref={ref}
			role='button'
			tabIndex={0}
			display='flex'
			justifyContent='space-between'
			alignItems='center'
			h='x40'
			className={['rcx-input-box__wrapper', customStyle, ...(Array.isArray(className) ? className : [className])].filter(Boolean)}
			{...props}
		>
			{isDirty ? `${t(selectedOptionsTitle as TranslationKey)} (${selectedOptionsCount})` : t(defaultTitle as TranslationKey)}
			<Icon name={collapsed ? 'chevron-up' : 'chevron-down'} fontSize='x20' color='hint' />
		</Box>
	);
});

export default MultiSelectCustomAnchor;
