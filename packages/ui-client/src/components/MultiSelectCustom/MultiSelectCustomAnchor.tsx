import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEventHandler } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { forwardRef } from 'react';

type MultiSelectCustomAnchorProps = {
	onClick?: MouseEventHandler<HTMLElement>;
	defaultTitle: TranslationKey;
	selectedOptionsTitle: TranslationKey;
	selectedOptionsCount: number;
	maxCount: number;
} & ComponentProps<typeof Button>;

export const MultiSelectCustomAnchor = forwardRef<HTMLElement, MultiSelectCustomAnchorProps>(function MultiSelectCustomAnchor(
	{ onClick, selectedOptionsCount, selectedOptionsTitle, defaultTitle, maxCount, ...props },
	ref,
) {
	const t = useTranslation();

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
			mis='x9'
			h='x40'
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
