import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import RemoveIcon from '../../icons/remove.svg';
import { Composer } from '../Composer';
import { MenuGroup, MenuItem } from '../Menu';
import { PopoverContainer } from '../Popover';
import Footer from './Footer';
import FooterContent from './FooterContent';
import FooterOptions from './FooterOptions';
import PoweredBy from './PoweredBy';
import '../../i18next';

export default {
	title: 'Components/Footer',
	component: Footer,
	decorators: [
		(storyFn) => (
			<div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
				<PopoverContainer>
					<div style={{ flex: '1' }} />
					{storyFn()}
				</PopoverContainer>
			</div>
		),
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof Footer>>;

export const Simple: StoryFn<ComponentProps<typeof Footer>> = (args) => (
	<Footer {...args}>
		<FooterContent>
			<PoweredBy />
		</FooterContent>
	</Footer>
);
Simple.storyName = 'simple';

export const WithComposerAndOptions: StoryFn<ComponentProps<typeof Footer>> = (args) => (
	<Footer {...args}>
		<FooterContent>
			<Composer placeholder='Insert your text here' />
		</FooterContent>
		<FooterContent>
			<FooterOptions>
				<MenuGroup>
					<MenuItem onClick={action('change-department')} icon={ChangeIcon}>
						Change department
					</MenuItem>
					<MenuItem onClick={action('remove-user-data')} icon={RemoveIcon}>
						Forget/Remove my personal data
					</MenuItem>
					<MenuItem danger onClick={action('finish-chat')} icon={FinishIcon}>
						Finish this chat
					</MenuItem>
				</MenuGroup>
			</FooterOptions>
			<PoweredBy />
		</FooterContent>
	</Footer>
);
WithComposerAndOptions.storyName = 'with Composer and options';
