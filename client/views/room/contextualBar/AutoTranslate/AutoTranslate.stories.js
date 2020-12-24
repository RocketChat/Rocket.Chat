import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import VerticalBar from '../../../../components/VerticalBar';

import { AutoTranslate } from '.';


export default {
	title: 'views/room/contextualBar/AutoTranslate',
	component: AutoTranslate,
};

const languages = [
	['en', 'English'],
	['jp', 'Japanese'],
	['pt', 'Portuguese'],
];

export const _AutoTranslate = () => (
	<Box height='600px'>
		<VerticalBar>
			<AutoTranslate languages={languages} defaultLanguage='en'/>
		</VerticalBar>
	</Box>
);
_AutoTranslate.storyName = 'AutoTranslate';
