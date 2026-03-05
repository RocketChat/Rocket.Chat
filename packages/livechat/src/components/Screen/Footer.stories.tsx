import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/preact';
import i18next from 'i18next';
import type { ComponentProps } from 'preact';

import { Screen, ScreenContent, ScreenFooter } from '.';
import { screenDecorator } from '../../../.storybook/helpers';
import { FooterOptions } from '../Footer';
import { MenuGroup, MenuItem } from '../Menu';

export default {
	title: 'Components/Screen/Footer',
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

export const Empty: StoryFn<ComponentProps<typeof ScreenFooter>> = () => <ScreenFooter />;
Empty.storyName = 'empty';

export const WithChildren: StoryFn<ComponentProps<typeof ScreenFooter>> = () => (
	<ScreenFooter>Lorem ipsum dolor sit amet, his id atqui repudiare.</ScreenFooter>
);
WithChildren.storyName = 'with children';

export const WithOptions: StoryFn<ComponentProps<typeof ScreenFooter>> = () => (
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
);
WithOptions.storyName = 'with options';
