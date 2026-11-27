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
	PasswordInput,
	SidebarItem,
	SidebarItemContent,
	SidebarItemTitle,
	Tag,
	ToggleSwitch,
} from '@rocket.chat/fuselage';

import { parse, type Root } from '@rocket.chat/message-parser';

import { AppAvatar, SvgAvatar, trimSvg } from './AppAvatar';
import { largeImageUrl, realRoomSvg, realUserSvg, svgVariants } from './avatarSamples';
import Markup from './markup/Markup';
import { mockAvatar, mockMessages } from './mockData';
import { UiKitMessage } from './uikit/SurfaceRenderer';
import { samplePayloads } from './uikit/payloads';
import { gradientJpeg, gradientPng, letterAvatars } from './mockAvatars';

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

// The server serves its default avatars as SVG (drawn by AppAvatar); the PNG is a remote bitmap
const avatarUrl = 'https://open.rocket.chat/avatar/rocket.cat';
const pngUrl = 'https://open.rocket.chat/images/logo/android-chrome-192x192.png';
const avatarFormats = [
	['svg', avatarUrl],
	['png', pngUrl],
	['png?etag', `${pngUrl}?etag=abc`],
	['jpeg', 'https://httpbin.org/image/jpeg'],
	['jpeg 2', 'https://picsum.photos/id/237/72/72.jpg'],
	['data png', gradientPng],
	['data jpeg', gradientJpeg],
	['data letter', letterAvatars.R],
] as const;

const astSamples = ['Shipping the **build** now, _carefully_ with `yarn build`.', 'See https://rocket.chat and ask @ada.lovelace in #general', '- one\n- two', '> quoted\nreply :tada:'];

// One node type per line, children indented
const astLines = (nodes: Root | readonly unknown[], depth = 0): string[] =>
	nodes.flatMap((node) => {
		const { type, value } = node as { type: string; value: unknown };
		const children = Array.isArray(value) ? astLines(value, depth + 1) : typeof value === 'object' && value !== null && 'type' in value ? astLines([value], depth + 1) : [];
		const leaf = typeof value === 'string' ? ` "${value}"` : '';
		return [`${'  '.repeat(depth)}${type}${leaf}`, ...children];
	});

function ParserAst() {
	return (
		<View style={{ gap: 8 }}>
			{astSamples.map((sample) => (
				<View key={sample}>
					<RNText style={{ fontSize: 11, fontWeight: 'bold' }}>{JSON.stringify(sample)}</RNText>
					<RNText style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{astLines(parse(sample)).join('\n')}</RNText>
				</View>
			))}
		</View>
	);
}

const markupSamples = [
	'# Heading 1\n## Heading 2\n### Heading 3\nPlain with **bold**, _italic_, ~~strike~~, `inline code` and **bold _nested italic_ text**.',
	'Link [label](https://rocket.chat) and https://rocket.chat/docs, @ada.lovelace @all in #general :tada: :custom_emoji: :) ||spoiler||',
	'> quoted line\n> second line',
	'- one\n- two with [a link](https://rocket.chat)\n  - nested **bold**\n\n1. first\n2. second\n\n- [x] done\n- [ ] todo',
	'```ts\nconst veryLongLine = "this code line is long enough to need a horizontal scroll inside the block";\nconsole.log(veryLongLine);\n```',
	'color: #00ff88 and rgba(255, 0, 128, 255) \\(a+b\\)',
	'| a | b |\n|---|---|\n| 1 | 2 |',
	'$$x^2 + y^2$$ and \\(a+b\\)',
	'---',
	'<t:1700000000:f> and <t:1700000000:R>',
	':rocket: :tada:',
	'😀',
];

function NativeMarkup() {
	const unknown = [{ type: 'FUTURE_NODE', value: [{ type: 'PLAIN_TEXT', value: 'unknown block text' }] }, { type: 'PARAGRAPH', value: [{ type: 'WHAT', value: 'x' }, { type: 'PLAIN_TEXT', value: 'after unknown inline' }] }] as unknown as Root;
	return (
		<View style={{ gap: 10, width: '100%' }}>
			{[...mockMessages.flatMap((m) => (m.md ? [{ key: m._id, md: m.md }] : [])), ...markupSamples.map((s) => ({ key: s, md: parse(s, { colors: true, emoticons: true, katex: { dollarSyntax: true, parenthesisSyntax: true } }) })), { key: 'unknown', md: unknown }].map(({ key, md }) => (
				<View key={key} style={{ borderLeftWidth: 2, borderLeftColor: '#ddd', paddingLeft: 6 }}>
					<Markup md={md} onMention={(t) => console.log('mention', t)} />
				</View>
			))}
		</View>
	);
}

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
					<PressProbe label='Tag'>
						<Tag onPress={() => undefined}>Tag</Tag>
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
					<PressProbe label='PasswordInput eye'>
						<PasswordInput value='secret' onChange={() => undefined} />
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
			<Cell name='Avatar'>
				<Avatar url={mockAvatar('rocket.cat')} size='x36' />
				<Avatar url={mockAvatar('rocket.cat')} size='x24' rounded />
				<Avatar url={pngUrl} size='x36' />
				<AppAvatar url={avatarUrl} />
				<AppAvatar url='https://open.rocket.chat/avatar/ggazzo' size='x24' rounded />
			</Cell>
			<Cell name='AppAvatar formats (x36, x24, rounded x36, rounded x24)'>
				{avatarFormats.map(([label, url]) => (
					<View key={label} style={{ alignItems: 'center', gap: 4 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
							<AppAvatar url={url} />
							<AppAvatar url={url} size='x24' />
							<AppAvatar url={url} rounded />
							<AppAvatar url={url} size='x24' rounded />
						</View>
						<RNText style={{ fontSize: 10 }}>{label}</RNText>
					</View>
				))}
			</Cell>
			<Cell name='Avatar real formats (x24 and x36 beside a title)'>
				{[['real user svg', realUserSvg], ['real room svg', realRoomSvg], ...Object.entries(svgVariants), ['large jpeg 1800x1200', undefined]].map(([label, xml]) => (
					<View key={label} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						{xml ? <SvgAvatar xml={trimSvg(xml)} size='x24' /> : <AppAvatar url={largeImageUrl} size='x24' />}
						{xml ? <SvgAvatar xml={trimSvg(xml)} /> : <AppAvatar url={largeImageUrl} />}
						<RNText style={{ fontSize: 12, flexShrink: 1 }}>{label}</RNText>
					</View>
				))}
			</Cell>
			<Cell name='message-parser AST'>
				<ParserAst />
			</Cell>
			<Cell name='Native markup'>
				<NativeMarkup />
			</Cell>
			<Cell name='UiKit (message blocks)'>
				<View style={{ gap: 14, width: '100%' }}>
					{samplePayloads.map(({ name, blocks }) => (
						<View key={name} style={{ gap: 4 }}>
							<RNText style={{ fontSize: 10, color: '#888' }}>{name}</RNText>
							<UiKitMessage blocks={blocks} onAction={(a) => console.log('uikit action', a)} />
						</View>
					))}
				</View>
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
				<Tag>@rocket.cat</Tag>
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

