import type { Meta, StoryObj } from '@storybook/preact';
import i18next from 'i18next';
import type { ComponentProps } from 'preact';
import { action } from 'storybook/actions';

import { Screen, ScreenContent, ScreenFooter } from '.';
import { screenDecorator } from '../../../.storybook/helpers';
import { FooterOptions } from '../Footer';
import { MenuGroup, MenuItem } from '../Menu';

export default {
	component: ScreenFooter,
	decorators: [
		(storyFn) => (
			<Screen title='Title'>
				<ScreenContent />
				{storyFn()}
			</Screen>
		),
		screenDecorator,
	],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof ScreenFooter>>;

type Story = StoryObj<ComponentProps<typeof ScreenFooter>>;

export const Empty: Story = {
	name: 'empty',
	render: () => <ScreenFooter />,
};

export const WithChildren: Story = {
	name: 'with children',
	render: () => <ScreenFooter>Lorem ipsum dolor sit amet, his id atqui repudiare.</ScreenFooter>,
};

export const WithOptions: Story = {
	name: 'with options',
	render: () => (
		<ScreenFooter
			options={
				<FooterOptions>
					<MenuGroup>
						<MenuItem onClick={action('changeDepartment')}>{i18next.t('change_department')}</MenuItem>
						<MenuItem onClick={action('removeUserData')}>{i18next.t('forget_remove_my_data')}</MenuItem>
						<MenuItem danger onClick={action('finishChat')}>
							{i18next.t('finish_this_chat')}
						</MenuItem>
					</MenuGroup>
				</FooterOptions>
			}
		/>
	),
};
