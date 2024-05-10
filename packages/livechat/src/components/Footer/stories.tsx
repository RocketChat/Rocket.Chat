import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Footer, FooterContent, FooterOptions, PoweredBy } from '.';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import RemoveIcon from '../../icons/remove.svg';
import { Composer } from '../Composer';
import Menu from '../Menu';
import { PopoverContainer } from '../Popover';

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

export const Simple: Story<ComponentProps<typeof Footer>> = (args) => (
	<Footer {...args}>
		<FooterContent>
			<PoweredBy />
		</FooterContent>
	</Footer>
);
Simple.storyName = 'simple';

export const WithComposerAndOptions: Story<ComponentProps<typeof Footer>> = (args) => (
	<Footer {...args}>
		<FooterContent>
			<Composer placeholder='Insert your text here' />
		</FooterContent>
		<FooterContent>
			<FooterOptions>
				<Menu.Group>
					<Menu.Item onClick={action('change-department')} icon={ChangeIcon}>
						Change department
					</Menu.Item>
					<Menu.Item onClick={action('remove-user-data')} icon={RemoveIcon}>
						Forget/Remove my personal data
					</Menu.Item>
					<Menu.Item danger onClick={action('finish-chat')} icon={FinishIcon}>
						Finish this chat
					</Menu.Item>
				</Menu.Group>
			</FooterOptions>
			<PoweredBy />
		</FooterContent>
	</Footer>
);
WithComposerAndOptions.storyName = 'with Composer and options';
