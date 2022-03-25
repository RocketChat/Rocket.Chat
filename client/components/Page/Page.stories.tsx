import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Page from '.';

export default {
	title: 'Components/Page',
	component: Page,
	subcomponents: {
		'Page.Content': Page.Content,
		'Page.Header': Page.Header,
		'Page.ScrollableContent': Page.ScrollableContent,
		'Page.ScrollableContentWithShadow': Page.ScrollableContentWithShadow,
	},
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof Page>;

const DummyContent = ({ rows = 10 }: { rows?: number }) => (
	<>
		{Array.from({ length: rows }, (_, i) => (
			<Box key={i} children='Content slice' marginBlock={16} />
		))}
	</>
);

export const Example: ComponentStory<typeof Page> = () => (
	<Page>
		<Page.Header title='A platform that prioritizes collaboration over vendor choices' />
		<Page.Content>
			<Box marginBlock={16}>
				Say goodbye to inefficient email threads and managing multiple guest accounts. Enable teams to communicate safely with partners,
				vendors, and suppliers directly from Rocket.Chat regardless of which collaboration platform they use.
			</Box>
		</Page.Content>
	</Page>
);

export const WithButtonsAtTheHeader: ComponentStory<typeof Page> = () => (
	<Page>
		<Page.Header title='Page Title'>
			<ButtonGroup>
				<Button primary type='button'>
					Perform action
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<DummyContent />
		</Page.Content>
	</Page>
);

export const WithScrollableContent: ComponentStory<typeof Page> = () => (
	<Page>
		<Page.Header title='Page Title' />
		<Page.ScrollableContent>
			<DummyContent rows={60} />
		</Page.ScrollableContent>
	</Page>
);

export const WithScrollableContentWithShadow: ComponentStory<typeof Page> = () => (
	<Page>
		<Page.Header title='Page Title' />
		<Page.ScrollableContentWithShadow>
			<DummyContent rows={60} />
		</Page.ScrollableContentWithShadow>
	</Page>
);
