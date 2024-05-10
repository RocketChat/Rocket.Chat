import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Page, PageContent, PageHeader, PageScrollableContent, PageScrollableContentWithShadow } from '.';

export default {
	title: 'Components/Page',
	component: Page,
	subcomponents: {
		PageContent,
		PageHeader,
		PageScrollableContent,
		PageScrollableContentWithShadow,
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
		<PageHeader title='A platform that prioritizes collaboration over vendor choices' />
		<PageContent>
			<Box marginBlock={16}>
				Say goodbye to inefficient email threads and managing multiple guest accounts. Enable teams to communicate safely with partners,
				vendors, and suppliers directly from Rocket.Chat regardless of which collaboration platform they use.
			</Box>
		</PageContent>
	</Page>
);

export const WithButtonsAtTheHeader: ComponentStory<typeof Page> = () => (
	<Page>
		<PageHeader title='Page Title'>
			<ButtonGroup>
				<Button primary type='button'>
					Perform action
				</Button>
			</ButtonGroup>
		</PageHeader>
		<PageContent>
			<DummyContent />
		</PageContent>
	</Page>
);

export const WithScrollableContent: ComponentStory<typeof Page> = () => (
	<Page>
		<PageHeader title='Page Title' />
		<PageScrollableContent>
			<DummyContent rows={60} />
		</PageScrollableContent>
	</Page>
);

export const WithScrollableContentWithShadow: ComponentStory<typeof Page> = () => (
	<Page>
		<PageHeader title='Page Title' />
		<PageScrollableContentWithShadow>
			<DummyContent rows={60} />
		</PageScrollableContentWithShadow>
	</Page>
);
