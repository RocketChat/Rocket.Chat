import React from 'react';

import { Counter } from './Counter';

export default {
	title: 'admin/enterprise/engagement/data/Counter',
	component: Counter,
};

export const _default = () => <Counter count={123} />;

export const withPositiveVariation = () => <Counter count={123} variation={4} />;

export const withNegativeVariation = () => <Counter count={123} variation={-4} />;

export const withDescription = () => <Counter count={123} description='Description' />;
