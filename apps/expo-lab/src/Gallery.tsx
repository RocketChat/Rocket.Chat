import './polyfills';
import { Component, useState, type ComponentProps, type ReactNode } from 'react';
import { LogBox, Text as RNText, ScrollView, Pressable, View } from 'react-native';
import { TamaguiProvider } from 'tamagui';
import '@tamagui/core';
import {
	Avatar,
	Badge,
	Banner,
	Button,
	Callout,
	CheckBox,
	Chip,
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
	SidebarItem,
	SidebarItemContent,
	SidebarItemTitle,
	Tag,
} from '@rocket.chat/fuselage';

import { tamaguiConfig } from '../../../packages/fuselage/src/tamagui.config';

// A frame that throws must not blank the screen: the error is the finding for that component
class Probe extends Component<{ children: ReactNode }, { error?: string }> {
	state: { error?: string } = {};

	static getDerivedStateFromError(error: Error) {
		return { error: `${error.name}: ${error.message}`.slice(0, 300) };
	}

	render() {
		if (this.state.error) return <RNText style={{ color: 'crimson', fontSize: 12 }}>{this.state.error}</RNText>;
		return this.props.children;
	}
}

function Cell({ name, children, presses }: { name: string; children: ReactNode; presses?: number }) {
	return (
		<View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
			<RNText style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
				{name}
				{presses === undefined ? '' : ` | presses: ${presses}`}
			</RNText>
			<Probe>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{children}</View>
			</Probe>
		</View>
	);
}

// The probes show each caught error inline; the dev overlay would cover them
LogBox.ignoreAllLogs();

// Two @tamagui/web type copies make the config type differ
type ProviderConfig = ComponentProps<typeof TamaguiProvider>['config'];

const avatarUrl = 'https://open.rocket.chat/avatar/rocket.cat';

function Content() {
	const [button, setButton] = useState(0);
	const [chip, setChip] = useState(0);
	const [item, setItem] = useState(0);
	const [sidebar, setSidebar] = useState(0);
	const [checked, setChecked] = useState(false);

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
			<Cell name='Avatar (not converted)'>
				<Avatar url={avatarUrl} size='x36' />
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
			<Cell name='Banner (not converted)'>
				<Banner title='Banner title'>Banner body</Banner>
			</Cell>
			<Cell name='Chip' presses={chip}>
				<Chip onPress={() => setChip((n) => n + 1)}>Chip</Chip>
			</Cell>
			<Cell name='Tag (not converted)'>
				<Tag>@rocket.cat</Tag>
			</Cell>
			<Cell name='Message parts (no Avatar)'>
				<Message>
					<MessageContainer>
						<MessageHeader>
							<MessageName>Rocket Cat</MessageName>
							<MessageUsername>@rocket.cat</MessageUsername>
							<MessageTimestamp>12:34</MessageTimestamp>
						</MessageHeader>
						<MessageBody>Hello from native Fuselage</MessageBody>
					</MessageContainer>
				</Message>
			</Cell>
			<Cell name='MessageName'>
				<MessageName>Rocket Cat</MessageName>
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
				<SidebarItem is='div' onPress={() => setSidebar((n) => n + 1)}>
					<SidebarItemContent>
						<SidebarItemTitle>random</SidebarItemTitle>
					</SidebarItemContent>
				</SidebarItem>
			</Cell>
			<Cell name={`CheckBox (checked: ${checked})`}>
				<CheckBox
					checked={checked}
					onChange={() => setChecked((c) => !c)}
					aria-label='Check'
				/>
			</Cell>
		</>
	);
}

export function Gallery({ onBack }: { onBack: () => void }) {
	return (
		<TamaguiProvider
			config={tamaguiConfig as ProviderConfig}
			defaultTheme='light'
		>
			<View style={{ flex: 1, paddingTop: 64, paddingHorizontal: 16 }}>
				<Pressable onPress={onBack} testID='gallery-back'>
					<RNText style={{ fontSize: 16, paddingBottom: 8 }}>{'< Back'}</RNText>
				</Pressable>
				<ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior='never' contentOffset={{ x: 0, y: 0 }}>
					<Content />
				</ScrollView>
			</View>
		</TamaguiProvider>
	);
}
