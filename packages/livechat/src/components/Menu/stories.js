import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, text, select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import Menu, { Group, Item, PopoverMenu } from '.';
import { centered } from '../../helpers.stories';
import BellIcon from '../../icons/bell.svg';
import ChangeIcon from '../../icons/change.svg';
import CloseIcon from '../../icons/close.svg';
import FinishIcon from '../../icons/finish.svg';
import { Button } from '../Button';
import { PopoverContainer } from '../Popover';

const defaultMenuItemText = 'A menu item';
const defaultAnotherMenuItemText = 'Another menu item';

storiesOf('Components/Menu', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('empty', () => <Menu hidden={boolean('hidden', false)} />)
	.add('simple', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', '')}>
				<Item onClick={action('clicked')}>{text('item text', defaultMenuItemText)}</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
		</Menu>
	))
	.add('placement', () => (
		<div style={{ position: 'relative' }}>
			<Button>Button</Button>
			<Menu
				hidden={boolean('hidden menu', false)}
				placement={select('placement', ['left-top', 'right-top', 'right-bottom', 'left-bottom'], 'right-bottom')}
			>
				<Group title={text('group title', '')}>
					<Item onClick={action('clicked')}>{text('item text', defaultMenuItemText)}</Item>
					<Item>{defaultAnotherMenuItemText}</Item>
				</Group>
			</Menu>
		</div>
	));

const centeredWithPopoverContainer = (storyFn, ...args) => (
	<div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
		<PopoverContainer>{centered(storyFn, ...args)}</PopoverContainer>
	</div>
);

storiesOf('Components/Menu/PopoverMenu', module)
	.addDecorator(withKnobs)
	.addDecorator(centeredWithPopoverContainer)
	.add('default', () => (
		<PopoverMenu
			// eslint-disable-next-line react/jsx-no-bind
			trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}
		>
			<Group>
				<Item>Reload</Item>
				<Item danger>Delete...</Item>
			</Group>
		</PopoverMenu>
	))
	.add('with overlay', () => (
		<PopoverMenu
			overlayed
			// eslint-disable-next-line react/jsx-no-bind
			trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}
		>
			<Group>
				<Item>Reload</Item>
				<Item danger>Delete...</Item>
			</Group>
		</PopoverMenu>
	));
storiesOf('Components/Menu/Group', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('single', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', '')}>
				<Item>{defaultMenuItemText}</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
		</Menu>
	))
	.add('multiple', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group #1 title', '')}>
				<Item>{defaultMenuItemText}</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
			<Group title={text('group #2 title', '')}>
				<Item>Report</Item>
			</Group>
		</Menu>
	))
	.add('with title', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', 'Are you sure?')}>
				<Item>{defaultMenuItemText}</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
		</Menu>
	));
storiesOf('Components/Menu/Item', module)
	.addDecorator(centered)
	.addDecorator(withKnobs)
	.add('simple', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', '')}>
				<Item onClick={action('clicked')}>{text('item text', defaultMenuItemText)}</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
		</Menu>
	))
	.add('primary', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', '')}>
				<Item primary onClick={action('clicked')}>
					{text('item text', defaultMenuItemText)}
				</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
		</Menu>
	))
	.add('danger', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', '')}>
				<Item danger onClick={action('clicked')}>
					{text('item text', defaultMenuItemText)}
				</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
		</Menu>
	))
	.add('disabled', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', '')}>
				<Item disabled onClick={action('clicked')}>
					{text('item text', defaultMenuItemText)}
				</Item>
				<Item>{defaultAnotherMenuItemText}</Item>
			</Group>
		</Menu>
	))
	.add('with icon', () => (
		<Menu hidden={boolean('hidden menu', false)}>
			<Group title={text('group title', '')}>
				<Item onClick={action('clicked')} icon={CloseIcon}>
					{text('item text', 'Simple')}
				</Item>
				<Item primary onClick={action('clicked')} icon={ChangeIcon}>
					{text('item text', 'Primary')}
				</Item>
				<Item danger onClick={action('clicked')} icon={FinishIcon}>
					{text('item text', 'Danger')}
				</Item>
				<Item disabled onClick={action('clicked')} icon={BellIcon}>
					{text('item text', 'Disabled')}
				</Item>
			</Group>
		</Menu>
	));
