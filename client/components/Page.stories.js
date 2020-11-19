import { Button, ButtonGroup, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { fullHeightDecorator } from '../../.storybook/decorators';
import Page from './Page';

export default {
	title: 'components/Page',
	component: Page,
};

const DummyContent = () => <>
	{Array.from({ length: 60 }, (_, i) => <Tile key={i} children='Content slice' marginBlock='x16' />)}
</>;

export const Basic = () =>
	<Page>
		<Page.Header title='Header' />
		<Page.Content>
			<DummyContent />
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
			<DummyContent />
		</Page.Content>
	</Page>;

export const WithScrollableContent = () =>
	<Page>
		<Page.Header title='Header' />
		<Page.ScrollableContent>
			<DummyContent />
		</Page.ScrollableContent>
	</Page>;
WithScrollableContent.story = {
	decorators: [fullHeightDecorator],
};

export const WithScrollableContentWithShadow = () =>
	<Page>
		<Page.Header title='Header' />
		<Page.ScrollableContentWithShadow>
			<DummyContent />
		</Page.ScrollableContentWithShadow>
	</Page>;
WithScrollableContentWithShadow.story = {
	decorators: [fullHeightDecorator],
};
