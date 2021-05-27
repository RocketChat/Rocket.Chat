import { Button } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import {
	TranslationKey,
	useTranslation,
} from '../../../../../../client/contexts/TranslationContext';

type TextButtonProps = {
	text: TranslationKey;
	action: () => void;
};

const TextButton: FC<TextButtonProps> = ({ text, action }) => {
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
		>
			{t(text)}
		</Button>
	);
};
export default memo(TextButton);
