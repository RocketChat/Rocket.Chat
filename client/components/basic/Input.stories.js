import React from 'react';

import { Input } from './Input';

export default {
	title: 'basic/Input',
	component: Input,
};

export const _default = () => <Input />;

export const withTitle = () => <Input title='Title' />;

export const withError = () => <Input error='Error' />;

export const withIcon = () => <Input icon='key' />;

export const withPlaceholder = () => <Input placeholder='Placeholder' />;

export const focused = () => <Input focused />;

export const ofTypeSelect = () => <Input type='select' options={[
	{ label: 'A', value: 'a' },
	{ label: 'B', value: 'b' },
	{ label: 'C', value: 'c' },
]} />;
