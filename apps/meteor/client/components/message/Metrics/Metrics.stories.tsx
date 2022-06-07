import React from 'react';

import Content from './Content';
import Reply from './Reply';
import Metrics from './index';

export default {
	title: 'Message/Metrics',
	component: Metrics,
};

export const Thread = () => (
	<Content>
		<Reply />
		<Metrics>
			<Metrics.Item>
				<Metrics.Item.Icon name='thread' />
				<Metrics.Item.Label>3</Metrics.Item.Label>
			</Metrics.Item>
			<Metrics.Item>
				<Metrics.Item.Icon name='user' />
				<Metrics.Item.Label>3</Metrics.Item.Label>
			</Metrics.Item>
			<Metrics.Item>
				<Metrics.Item.Icon name='clock' />
				<Metrics.Item.Label>sunday</Metrics.Item.Label>
			</Metrics.Item>
			<Metrics.Item>
				<Metrics.Item.Icon name='bell' />
				<Metrics.Item.Label>3</Metrics.Item.Label>
			</Metrics.Item>
		</Metrics>
	</Content>
);

export const Discussion = () => (
	<Content>
		<Reply />
		<Metrics>
			<Metrics.Item>
				<Metrics.Item.Label>sunday</Metrics.Item.Label>
			</Metrics.Item>
		</Metrics>
	</Content>
);
