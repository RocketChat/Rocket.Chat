import { Button, ButtonGroup, Margins, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import Page from './Page';

export default {
	title: 'basic/Page',
	component: Page,
	decorators: [
		(fn) => <div className='rc-old'>{fn()}</div>,
	],
};

export const _default = () =>
	<Page>
		<Page.Header title='Header' />
		<Page.Content>
			<Margins block='x16'>
				{Array.from({ length: 60 }, (_, i) => <Tile key={i} children='Content slice' />)}
			</Margins>
		</Page.Content>
	</Page>;

export const withButtonsAtTheHeader = () =>
	<Page>
		<Page.Header title='Header'>
			<ButtonGroup>
				<Button primary type='button'>Hooray!</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<Margins block='x16'>
				{Array.from({ length: 60 }, (_, i) => <Tile key={i} children='Content slice' />)}
			</Margins>
		</Page.Content>
	</Page>;
