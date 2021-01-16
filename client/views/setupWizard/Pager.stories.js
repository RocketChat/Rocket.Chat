import { action } from '@storybook/addon-actions';
import React from 'react';

import { Pager } from './Pager';

export default {
	title: 'views/setupWizard/Pager',
	component: Pager,
};

export const _default = () =>
	<Pager
		disabled={false}
		isContinueEnabled={false}
	/>;

export const withBackButton = () =>
	<Pager onBackClick={action('backClick')} />;

export const disabled = () =>
	<Pager disabled onBackClick={action('backClick')} />;

export const withContinueDisabled = () =>
	<Pager isContinueEnabled={false} onBackClick={action('backClick')} />;
