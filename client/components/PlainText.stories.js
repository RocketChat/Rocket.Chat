import React from 'react';

import PlainText from './PlainText';

export default {
	title: 'components/PlainText',
	component: PlainText,
};

export const Neutral = () => <PlainText type='neutral'>
	<strong>Lorem ipsum</strong> dolor sit amet, consectetur adipiscing elit, <em>sed</em> do eiusmod tempor <a href='#'>Details</a> <button type='button'>Cancel</button>
</PlainText>;

export const Info = () => <PlainText type='info'>
	<strong>Lorem ipsum</strong> dolor sit amet, consectetur adipiscing elit, <em>sed</em> do eiusmod tempor <a href='#'>Details</a> <button type='button'>Cancel</button>
</PlainText>;

export const Success = () => <PlainText type='success'>
	<strong>Lorem ipsum</strong> dolor sit amet, consectetur adipiscing elit, <em>sed</em> do eiusmod tempor <a href='#'>Details</a> <button type='button'>Cancel</button>
</PlainText>;

export const Warning = () => <PlainText type='warning'>
	<strong>Lorem ipsum</strong> dolor sit amet, consectetur adipiscing elit, <em>sed</em> do eiusmod tempor <a href='#'>Details</a> <button type='button'>Cancel</button>
</PlainText>;

export const Danger = () => <PlainText type='danger'>
	<strong>Lorem ipsum</strong> dolor sit amet, consectetur adipiscing elit, <em>sed</em> do eiusmod tempor <a href='#'>Details</a> <button type='button'>Cancel</button>
</PlainText>;
