import { Button } from '@rocket.chat/fuselage';
import React, { forwardRef, memo } from 'react';

import {
	TranslationKey,
	useTranslation,
} from '../../../../../../client/contexts/TranslationContext';

type TextButtonProps = {
	text: TranslationKey;
	action: () => void;
};

const TextButton = forwardRef<Element, TextButtonProps>(function TextButton({ text, action }, ref) {
	const t = useTranslation();

	return (
		<Button
			nude
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
