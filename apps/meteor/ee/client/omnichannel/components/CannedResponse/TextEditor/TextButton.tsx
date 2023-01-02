import { Button } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { forwardRef, memo } from 'react';

type TextButtonProps = {
	text: TranslationKey;
	action: () => void;
};

const TextButton = forwardRef<HTMLElement, TextButtonProps>(function TextButton({ text, action }, ref) {
	const t = useTranslation();

	return (
		<Button
			small
			display='flex'
			justifyContent='center'
			alignItems='center'
			onClick={(e): void => {
				e.stopPropagation();
				e.preventDefault();
				action();
			}}
			ref={ref}
		>
			{t(text)}
		</Button>
	);
});
export default memo(TextButton);
