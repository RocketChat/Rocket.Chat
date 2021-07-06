import React from 'react';

import Counter from './Counter';

export default {
	title: 'components/data/Counter',
	component: Counter,
};

export const Default = () => <Counter count={123} />;

export const WithPositiveVariation = () => <Counter count={123} variation={4} />;

export const WithNegativeVariation = () => <Counter count={123} variation={-4} />;

export const WithDescription = () => <Counter count={123} description='Description' />;
