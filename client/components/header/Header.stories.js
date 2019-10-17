import { boolean, text } from '@storybook/addon-knobs/react';
import React from 'react';

import { Button } from '../basic/Button';
import { Header } from './Header';

export default {
	title: 'header/Header',
	component: Header,
};

export const _default = () =>
	<Header
		hideHelp={boolean('hideHelp')}
		rawSectionName={text('rawSectionName')}
		sectionName={text('sectionName')}
	/>;

export const withRawSectionName = () =>
	<Header rawSectionName='Welcome to Rocket.Chat' />;

export const withSectionName = () =>
	<Header sectionName='Accounts_Enrollment_Email_Subject_Default' />;

export const withButton = () =>
	<Header rawSectionName='Welcome to Rocket.Chat' hideHelp>
		<div className='rc-header__block rc-header__block-action'>
			<Button primary type='button'>
				Hooray!
			</Button>
		</div>
	</Header>;
