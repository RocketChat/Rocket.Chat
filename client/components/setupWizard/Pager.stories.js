import { action } from '@storybook/addon-actions';
import { boolean } from '@storybook/addon-knobs';
import React from 'react';

import { Pager } from './Pager';

export default {
	title: 'setupWizard/Pager',
	component: Pager,
};

export const _default = () =>
	<Pager
		disabled={boolean('disabled')}
		isContinueEnabled={boolean('isContinueEnabled')}
	/>;

export const withBackButton = () =>
	<Pager onBackClick={action('backClick')} />;

export const disabled = () =>
	<Pager disabled onBackClick={action('backClick')} />;

export const withContinueDisabled = () =>
	<Pager isContinueEnabled={false} onBackClick={action('backClick')} />;
