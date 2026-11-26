import { Component, useState, type ReactNode } from 'react';
import { Platform, Text as RNText, View } from 'react-native';
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
} from '@rocket.chat/fuselage';

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


type FiberLike = { type?: unknown; memoizedProps?: Record<string, unknown> | null; child?: FiberLike | null; sibling?: FiberLike | null };

const pressKeys = ['onPress', 'onPressIn', 'onClick', 'onResponderRelease', 'onStartShouldSetResponder'];

const fiberName = (fiber: FiberLike) => {
	const type = fiber.type as { displayName?: string; name?: string } | string | undefined;
	return typeof type === 'string' ? type : (type?.displayName ?? type?.name ?? '?');
};

// Dev probe: lists the fibers under it that carry a press prop, which is how a missing handler on the frame shows without touch input
class PressProbe extends Component<{ label: string; children: ReactNode }, { found?: string }> {
	state: { found?: string } = {};

	componentDidMount() {
		const root = (this as unknown as { _reactInternals?: FiberLike })._reactInternals;
		const hits: string[] = [];
		const walk = (fiber: FiberLike | null | undefined) => {
			for (let f = fiber; f; f = f.sibling) {
				const keys = pressKeys.filter((k) => typeof f.memoizedProps?.[k] === 'function');
				if (keys.length) hits.push(`${fiberName(f)}[${keys.join(',')}]`);
				walk(f.child);
			}
		};
		walk(root?.child);
		this.setState({ found: hits.length ? hits.join(' > ') : 'NO press prop on any fiber' });
	}

	render() {
		return (
			<View>
				{this.props.children}
				<RNText style={{ fontSize: 10, color: this.state.found?.startsWith('NO') ? 'crimson' : '#060' }}>
					{this.props.label}: {this.state.found ?? '...'}
				</RNText>
			</View>
		);
	}
}

// Natively these throw on a DOM tag and the dev overlay covers the screen; EXPO_PUBLIC_GALLERY_PROBE=1 renders them anyway
const skipThrowing = Platform.OS !== 'web' && process.env.EXPO_PUBLIC_GALLERY_PROBE !== '1';

// EXPO_PUBLIC_GALLERY_ONLY=Item,NavBar shows only the cells whose name contains one of them, to photograph a part of a long gallery
const only = process.env.EXPO_PUBLIC_GALLERY_ONLY?.split(',').filter(Boolean);

function Cell({ name, children, presses, throws }: { name: string; children: ReactNode; presses?: number; throws?: boolean }) {
	if (only && !only.some((part: string) => name.includes(part))) return null;

	return (
		<View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
			<RNText style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
				{name}
				{presses === undefined ? '' : ` | presses: ${presses}`}
			</RNText>
			<Probe>
				{throws && skipThrowing ? <RNText style={{ fontSize: 12, color: 'crimson' }}>throws natively on a DOM tag (skipped)</RNText> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{children}</View>}
			</Probe>
		</View>
	);
}

const avatarUrl = 'https://open.rocket.chat/avatar/rocket.cat';

export function Content() {
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
			<Cell name='Press attach probe (dev)'>
				<View style={{ gap: 6 }}>
					<PressProbe label='control View, no onPress'>
						<View style={{ height: 8 }} />
					</PressProbe>
					<PressProbe label='Button'>
						<Button onPress={() => undefined}>Button</Button>
					</PressProbe>
					<PressProbe label='Chip'>
						<Chip onPress={() => undefined}>Chip</Chip>
					</PressProbe>
					<PressProbe label='Item'>
						<Item onPress={() => undefined}>
							<ItemContent>
								<ItemTitle>Item</ItemTitle>
							</ItemContent>
						</Item>
					</PressProbe>
					<PressProbe label='SidebarItem'>
						<SidebarItem onPress={() => undefined}>
							<SidebarItemContent>
								<SidebarItemTitle>SidebarItem</SidebarItemTitle>
							</SidebarItemContent>
						</SidebarItem>
					</PressProbe>
					<PressProbe label='Message onPress'>
						<Message onClick={() => undefined}>
							<MessageContainer>
								<MessageBody>Message</MessageBody>
							</MessageContainer>
						</Message>
					</PressProbe>
				</View>
			</Cell>
			<Cell name='Badge primary / secondary / danger'>
				<Badge variant='primary'>3</Badge>
				<Badge variant='secondary'>12</Badge>
				<Badge variant='danger'>99</Badge>
			</Cell>
			<Cell name='Avatar (not converted)' throws>
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
			<Cell name='Banner (not converted)' throws>
				<Banner title='Banner title'>Banner body</Banner>
			</Cell>
			<Cell name='Chip' presses={chip}>
				<Chip onPress={() => setChip((n) => n + 1)}>Chip</Chip>
			</Cell>
			<Cell name='Tag (not converted)' throws>
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
				<CheckBox
					checked={checked}
					onChange={() => setChecked((c) => !c)}
					aria-label='Check'
				/>
			</Cell>
		</>
	);
}

