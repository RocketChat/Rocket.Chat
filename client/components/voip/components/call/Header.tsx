import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

// import { useTranslation } from '../../../../contexts/TranslationContext';

const Header: FC<{ calls: number }> = ({ calls }) => {
	// const t = useTranslation();
	console.log('fuck ts');
	return <Box textAlign='center'>{calls}</Box>;
};

export default Header;
