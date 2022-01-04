import { Button, ButtonGroup, Tile } from '@rocket.chat/fuselage';
import { Story } from '@storybook/react';
import React, { ReactElement } from 'react';

import Page from '.';
import { fullHeightDecorator } from '../../../.storybook/decorators';

export default {
	title: 'components/Page',
	component: Page,
};

const DummyContent = (): ReactElement => (
	<>
		{Array.from({ length: 60 }, (_, i) => (
			<Tile key={i} children='Content slice' marginBlock='x16' />
		))}
	</>
);

export const Basic: Story = () => (
	<Page>
		<Page.Header title='Header' />
		<Page.Content>
			<DummyContent />
		</Page.Content>
	</Page>
);

export const WithButtonsAtTheHeader: Story = (): ReactElement => (
	<Page>
		<Page.Header title='Header'>
			<ButtonGroup>
				<Button primary type='button'>
					Hooray!
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<DummyContent />
		</Page.Content>
	</Page>
);

export const WithScrollableContent = (): ReactElement => (
	<Page>
		<Page.Header title='Header' />
		<Page.ScrollableContent>
			<DummyContent />
		</Page.ScrollableContent>
	</Page>
);
WithScrollableContent.decorators = [fullHeightDecorator];

export const WithScrollableContentWithShadow = (): ReactElement => (
	<Page>
		<Page.Header title='Header' />
		<Page.ScrollableContentWithShadow>
			<DummyContent />
		</Page.ScrollableContentWithShadow>
	</Page>
);
WithScrollableContentWithShadow.decorators = [fullHeightDecorator];
