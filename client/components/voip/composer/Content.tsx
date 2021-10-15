import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';

type ContentPropsType = {
	icon: string;
	text: TranslationKey;
};

const Content = ({ icon, text }: ContentPropsType): ReactElement => {
	const t = useTranslation();

	return (
		<Box
			w='full'
			h='full'
			display='flex'
			flexDirection='row'
			alignItems='center'
			justifyContent='center'
		>
			<Icon color='neutral-700' size='24px' name={icon} />
			<Box mis='4px' fontScale='p2' color='neutral-700'>
				{t(text)}
			</Box>
		</Box>
	);
};

export default Content;
