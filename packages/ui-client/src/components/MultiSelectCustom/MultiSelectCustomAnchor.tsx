import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export type MultiSelectCustomAnchorProps = {
	collapsed: boolean;
	defaultTitle: string;
	selectedOptionsTitle: string;
	selectedOptionsCount: number;
	maxCount: number;
} & ComponentPropsWithoutRef<typeof Box>;

const MultiSelectCustomAnchor = forwardRef<HTMLElement, MultiSelectCustomAnchorProps>(function MultiSelectCustomAnchor(
	{ className, collapsed, selectedOptionsCount, selectedOptionsTitle, defaultTitle, maxCount, ...props },
	ref,
) {
	const { t } = useTranslation();
	const customStyle = css`
		position: relative;
		min-width: 9rem;
		padding-block: 8px;
		padding-inline: 15px;
		border-width: 1px;
		border-radius: var(--rcx-input-border-radius, var(--rcx-border-radius-medium, 0.25rem));

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
			flexGrow={1}
			justifyContent='space-between'
			alignItems='center'
			height='x40'
			fontScale='p2m'
			className={['rcx-input-box__wrapper', customStyle, ...(Array.isArray(className) ? className : [className])].filter(Boolean)}
			{...props}
		>
			{isDirty ? `${t(selectedOptionsTitle as TranslationKey)} (${selectedOptionsCount})` : t(defaultTitle as TranslationKey)}
			<Icon name={collapsed ? 'chevron-up' : 'chevron-down'} size='x20' color='hint' />
		</Box>
	);
});

export default MultiSelectCustomAnchor;
