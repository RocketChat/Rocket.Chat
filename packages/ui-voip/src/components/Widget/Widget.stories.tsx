import { ButtonGroup, Button, IconButton } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import { Widget, WidgetHeader, WidgetFooter, WidgetHandle, WidgetInfo, WidgetContent } from '.';

export default {
	title: 'V2/Components/Widget',
	component: Widget,
	decorators: [(Story) => <Story />],
} satisfies Meta<typeof Widget>;

export const FullWidget: StoryFn<typeof Widget> = () => {
	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title='Incoming Call...'>
				<IconButton name='close' icon='cross' mini />
			</WidgetHeader>
			<WidgetInfo
				slots={[
					{ text: 'On hold', type: 'info' },
					{ text: 'Muted', type: 'warning' },
				]}
			/>
			<WidgetContent>The content of the widget</WidgetContent>
			<WidgetFooter>
				<ButtonGroup stretch>
					<Button medium name='phone-off' icon='phone-off' danger>
						Reject
					</Button>
					<Button medium name='phone' icon='phone' success>
						Accept
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};
