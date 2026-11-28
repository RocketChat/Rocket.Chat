import {
	Avatar,
	Badge,
	Banner,
	Button,
	Callout,
	CheckBox,
	Chip,
	Contextualbar,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarTitle,
	Icon,
	Item,
	ItemContent,
	ItemIcon,
	ItemMeta,
	ItemTitle,
	Message,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageName,
	MessageTimestamp,
	MessageUsername,
	NavBar,
	NavBarSection,
	SidebarItem,
	SidebarItemContent,
	SidebarItemTitle,
	Tag,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { useState } from 'react';
import { Text as RNText, View } from 'react-native';

import { Cell } from './GalleryCell';
import { gradientJpeg, gradientPng, letterAvatars } from './avatars';

const avatarFormats = [
	['data png', gradientPng],
	['data jpeg', gradientJpeg],
	['data letter', letterAvatars.R],
] as const;

export function Content() {
	const [button, setButton] = useState(0);
	const [chip, setChip] = useState(0);
	const [item, setItem] = useState(0);
	const [sidebar, setSidebar] = useState(0);
	const [checked, setChecked] = useState(false);
	const [toggled, setToggled] = useState(true);

	return (
		<>
			<Cell name='Button primary / secondary / danger' presses={button}>
				<Button variant='primary' onPress={() => setButton((n) => n + 1)}>
					Primary
				</Button>
				<Button variant='secondary' onPress={() => setButton((n) => n + 1)}>
					Secondary
				</Button>
				<Button variant='danger' onPress={() => setButton((n) => n + 1)}>
					Danger
				</Button>
			</Cell>
			<Cell name='Badge primary / secondary / danger'>
				<Badge variant='primary'>3</Badge>
				<Badge variant='secondary'>12</Badge>
				<Badge variant='danger'>99</Badge>
			</Cell>
			<Cell name='Avatar'>
				<Avatar url={letterAvatars.R} size='x36' />
				<Avatar url={letterAvatars.A} size='x24' rounded />
			</Cell>
			<Cell name='Avatar image formats (x36, x24, rounded x36, rounded x24)'>
				{avatarFormats.map(([label, url]) => (
					<View key={label} style={{ alignItems: 'center', gap: 4 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
							<Avatar url={url} size='x36' />
							<Avatar url={url} size='x24' />
							<Avatar url={url} size='x36' rounded />
							<Avatar url={url} size='x24' rounded />
						</View>
						<RNText style={{ fontSize: 10 }}>{label}</RNText>
					</View>
				))}
			</Cell>
			<Cell name='Icon'>
				<Icon name='bell' size='x24' />
				<Icon name='check' size='x24' color='danger' />
			</Cell>
			<Cell name='Callout info / danger'>
				<Callout type='info' title='Heads up'>
					A converted frame
				</Callout>
				<Callout type='danger' title='Failed'>
					Something went wrong
				</Callout>
			</Cell>
			<Cell name='Banner'>
				<Banner title='Banner title'>Banner body</Banner>
			</Cell>
			<Cell name='Chip' presses={chip}>
				<Chip onPress={() => setChip((n) => n + 1)}>Chip</Chip>
			</Cell>
			<Cell name='Tag'>
				<Tag>@ada.lovelace</Tag>
				<Tag variant='secondary-danger'>Admin</Tag>
			</Cell>
			<Cell name={`ToggleSwitch (checked: ${toggled})`}>
				<ToggleSwitch checked={toggled} onChange={() => setToggled((c) => !c)} aria-label='Toggle' />
				<ToggleSwitch checked disabled aria-label='Checked, disabled' />
			</Cell>
			<Cell name='Message parts (no Avatar)'>
				<Message>
					<MessageContainer>
						<MessageHeader>
							<MessageName>Ada Lovelace</MessageName>
							<MessageUsername>@ada.lovelace</MessageUsername>
							<MessageTimestamp>12:34</MessageTimestamp>
						</MessageHeader>
						<MessageBody>Hello from native Fuselage</MessageBody>
					</MessageContainer>
				</Message>
			</Cell>
			<Cell name='MessageName'>
				<MessageName>Ada Lovelace</MessageName>
			</Cell>
			<Cell name='MessageBody'>
				<MessageBody>Hello from native Fuselage</MessageBody>
			</Cell>
			<Cell name='MessageTimestamp'>
				<MessageTimestamp>12:34</MessageTimestamp>
			</Cell>
			<Cell name='Item row' presses={item}>
				<Item onPress={() => setItem((n) => n + 1)}>
					<ItemIcon>
						<Icon name='hash' size='x16' />
					</ItemIcon>
					<ItemContent>
						<ItemTitle>general</ItemTitle>
					</ItemContent>
					<ItemMeta>12:34</ItemMeta>
				</Item>
			</Cell>
			<Cell name='SidebarItem row' presses={sidebar}>
				<SidebarItem onPress={() => setSidebar((n) => n + 1)}>
					<SidebarItemContent>
						<SidebarItemTitle>random</SidebarItemTitle>
					</SidebarItemContent>
				</SidebarItem>
			</Cell>
			<Cell name='Contextualbar header + content (L4)'>
				<Contextualbar>
					<ContextualbarHeader>
						<ContextualbarTitle>Thread</ContextualbarTitle>
					</ContextualbarHeader>
					<ContextualbarContent>
						<MessageBody>Contextualbar content</MessageBody>
					</ContextualbarContent>
				</Contextualbar>
			</Cell>
			<Cell name='NavBar + NavBarSection (L5)'>
				<NavBar>
					<NavBarSection>
						<MessageName>Home</MessageName>
					</NavBarSection>
					<NavBarSection>
						<Icon name='bell' size='x20' />
					</NavBarSection>
				</NavBar>
			</Cell>
			<Cell name={`CheckBox (checked: ${checked})`}>
				<CheckBox checked={checked} onChange={() => setChecked((c) => !c)} aria-label='Check' />
			</Cell>
		</>
	);
}
