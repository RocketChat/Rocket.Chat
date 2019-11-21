import { action } from '@storybook/addon-actions';
import { boolean, text } from '@storybook/addon-knobs';
import React from 'react';

import { Button } from './Button';

export default {
	title: 'basic/Button',
	component: Button,
};

export const _default = () => <Button
	children={text('children', 'Button')}
	invisible={boolean('invisible')}
	primary={boolean('primary')}
	secondary={boolean('secondary')}
	cancel={boolean('cancel')}
	nude={boolean('nude')}
	submit={boolean('submit')}
	onClick={action('click')}
/>;

export const invisible = () => <Button invisible>Button</Button>;

export const primary = () => <Button primary>Button</Button>;

export const secondary = () => <Button secondary>Button</Button>;

export const cancel = () => <Button cancel>Button</Button>;

export const nude = () => <Button nude>Button</Button>;

export const submit = () => <Button submit>Button</Button>;
