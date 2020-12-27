import { Button, ButtonGroup, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { fullHeightDecorator } from '../../../.storybook/decorators';

import Page from '.';

export default {
	title: 'components/Page',
	component: Page,
	subcomponents: {
		'Page.Header': Page.Header,
		'Page.Content': Page.Content,
		'Page.ScrollableContent': Page.ScrollableContent,
		'Page.ScrollableContentWithShadow': Page.ScrollableContentWithShadow,
	},
	parameters: {
		layout: 'fullscreen',
	},
};

const DummyContent = ({ length = 60 }) => <>
	{Array.from({ length }, (_, i) => <Tile key={i} children='Content slice' marginBlock='x16' />)}
</>;

export const Basic = () =>
	<Page>
		<Page.Header title='Header' />
		<Page.Content>
			<DummyContent length={3} />
		</Page.Content>
	</Page>;

export const WithButtonsAtTheHeader = () =>
	<Page>
		<Page.Header title='Header'>
			<ButtonGroup>
				<Button primary type='button'>Hooray!</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<DummyContent length={3} />
		</Page.Content>
	</Page>;

export const WithScrollableContent = () =>
	<Page>
		<Page.Header title='Header' />
		<Page.ScrollableContent>
			<DummyContent />
		</Page.ScrollableContent>
	</Page>;
WithScrollableContent.decorators = [
	fullHeightDecorator,
];

export const WithScrollableContentWithShadow = () =>
	<Page>
		<Page.Header title='Header' />
		<Page.ScrollableContentWithShadow>
			<DummyContent />
		</Page.ScrollableContentWithShadow>
	</Page>;
WithScrollableContentWithShadow.decorators = [
	fullHeightDecorator,
];
