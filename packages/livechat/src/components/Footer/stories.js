import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';
import '../../i18next';

import { Footer, FooterContent, FooterOptions, PoweredBy } from '.';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import RemoveIcon from '../../icons/remove.svg';
import { Composer } from '../Composer';
import Menu from '../Menu';
import { PopoverContainer } from '../Popover';


const bottomWithPopoverContainer = (storyFn) => (
	<div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
		<PopoverContainer>
			<div style={{ flex: '1' }} />
			{storyFn()}
		</PopoverContainer>
	</div>
);

storiesOf('Components/Footer', module)
	.addDecorator(bottomWithPopoverContainer)
	.add('simple', () => (
		<Footer>
			<FooterContent>
				<PoweredBy />
			</FooterContent>
		</Footer>
	))
	.add('with Composer and options', () => (
		<Footer>
			<FooterContent>
				<Composer placeholder='Insert your text here' />
			</FooterContent>
			<FooterContent>
				<FooterOptions>
					<Menu.Group>
						<Menu.Item onClick={action('change-department')} icon={ChangeIcon}>Change department</Menu.Item>
						<Menu.Item onClick={action('remove-user-data')} icon={RemoveIcon}>Forget/Remove my personal data</Menu.Item>
						<Menu.Item danger onClick={action('finish-chat')} icon={FinishIcon}>Finish this chat</Menu.Item>
					</Menu.Group>
				</FooterOptions>
				<PoweredBy />
			</FooterContent>
		</Footer>
	));
