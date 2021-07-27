import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import AutoTranslate from './AutoTranslate';

export default {
	title: 'room/contextualBar/AutoTranslate',
	component: AutoTranslate,
};

const languages = [
	['en', 'English'],
	['jp', 'Japanese'],
	['pt', 'Portuguese'],
];

export const Default = () => (
	<Box height='600px'>
		<VerticalBar>
			<AutoTranslate languages={languages} defaultLanguage='en' />
		</VerticalBar>
	</Box>
);
