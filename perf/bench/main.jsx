import * as F from 'fuselage-under-test';
import { PureItem, PureItemContent, PureItemDescription, PureItemMedia, PureItemMeta, PureItemRow, PureItemTitle } from 'fuselage-under-test';
import { ButtonGroup, Message, MessageBody, MessageContainer, MessageHeader, MessageName, MessageNameContainer, MessageTimestamp, MessageToolbarWrapper, MessageUsername } from 'fuselage-under-test';
import 'fuselage-under-test-css';
import { Profiler } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

const params = new URLSearchParams(location.search);
const scenario = params.get('scenario');
const n = Number(params.get('n'));
const withRoot = params.get('root') === '1';

const Root = withRoot && F.FuselageProvider ? F.FuselageProvider : ({ children }) => children;

// One component per row state, each with literal props, so the compiler can flatten every element of the row
const PureRowBody = ({ i, v, highlight }) =>
	highlight ? (
		<PureItemContent>
			<PureItemRow>
				<PureItemTitle highlight='item'>{`room ${i}`}</PureItemTitle>
				<PureItemMeta highlight='item'>{`12:${v}0`}</PureItemMeta>
			</PureItemRow>
			<PureItemRow>
				<PureItemDescription highlight='item'>{`preview text ${i} ${v}`}</PureItemDescription>
			</PureItemRow>
		</PureItemContent>
	) : (
		<PureItemContent>
			<PureItemRow>
				<PureItemTitle>{`room ${i}`}</PureItemTitle>
				<PureItemMeta>{`12:${v}0`}</PureItemMeta>
			</PureItemRow>
			<PureItemRow>
				<PureItemDescription>{`preview text ${i} ${v}`}</PureItemDescription>
			</PureItemRow>
		</PureItemContent>
	);
const pureMedia = () => (
	<PureItemMedia>
		<span className='avatar' />
	</PureItemMedia>
);
const PureRow = ({ i, v }) => {
	if (i === 0) {
		return (
			<PureItem render='a' href={`#${i}`} inset='md' selected highlighted surface='selected' pointer='interactive' gap='x8'>
				{pureMedia()}
				<PureRowBody i={i} v={v} highlight />
			</PureItem>
		);
	}
	if (i % 3 === 0) {
		return (
			<PureItem render='a' href={`#${i}`} inset='md' highlighted surface='interactive' pointer='interactive' gap='x8'>
				{pureMedia()}
				<PureRowBody i={i} v={v} highlight />
			</PureItem>
		);
	}
	return (
		<PureItem render='a' href={`#${i}`} inset='md' surface='interactive' pointer='interactive' gap='x8'>
			{pureMedia()}
			<PureRowBody i={i} v={v} />
		</PureItem>
	);
};

const rows = {
	box: (i, v) => (
		<F.Box key={i} p='x8' fontScale='p2'>
			{`Box ${i} ${v}`}
		</F.Box>
	),
	button: (i, v) => (
		<F.Button key={i} primary={v % 2 === 0} small>
			{`Label ${i}`}
		</F.Button>
	),
	buttonStyled: (i, v) => (
		<F.Button key={i} primary={v % 2 === 0} small marginInlineEnd='x8' marginBlock={4} paddingInline='x12' width='x120'>
			{`Label ${i}`}
		</F.Button>
	),
	// As the app renders it: the toolbar wrapper is always mounted, the toolbar itself only once visible
	messageFull: (i, v) => (
		<Message key={i}>
			<MessageContainer>
				<MessageHeader>
					<MessageNameContainer>
						<MessageName>{`User ${i}`}</MessageName>
						<MessageUsername>{`@user${i}`}</MessageUsername>
					</MessageNameContainer>
					<MessageTimestamp>{`12:0${v}`}</MessageTimestamp>
				</MessageHeader>
				<MessageBody>{`Hello world ${i} ${v}`}</MessageBody>
			</MessageContainer>
			<MessageToolbarWrapper />
		</Message>
	),
	buttonGroup: (i, v) => (
		<div key={i}>
			<ButtonGroup small align='end'>
				<span>{`a ${i} ${v}`}</span>
			</ButtonGroup>
			<ButtonGroup vertical className='consumer'>
				<span>{`b ${i}`}</span>
			</ButtonGroup>
			<ButtonGroup>
				<span>{`c ${i}`}</span>
			</ButtonGroup>
		</div>
	),
	messageStyled: (i, v) => (
		<MessageContainer key={i} marginBlockEnd='x8'>
			<MessageName paddingInline='x4' width='x120'>{`User ${i}`}</MessageName>
			<MessageTimestamp marginInlineStart='x12'>{`12:0${v}`}</MessageTimestamp>
		</MessageContainer>
	),
	tag: (i, v) => (
		<F.Tag key={i} variant={v % 2 ? 'primary' : 'secondary'}>
			{`tag ${i}`}
		</F.Tag>
	),
	item: (i, v) => (
		<F.Item key={i} is='li' selected={v % 2 === 0 && i === 0} highlighted={i % 3 === 0}>
			<F.ItemMedia>
				<F.Box size='x28' bg='light' />
			</F.ItemMedia>
			<F.ItemContent>
				<F.ItemRow>
					<F.ItemTitle>
						<F.ItemLink href={`#${i}`}>{`room ${i}`}</F.ItemLink>
					</F.ItemTitle>
					<F.ItemMeta>{`12:${v}0`}</F.ItemMeta>
				</F.ItemRow>
				<F.ItemRow>
					<F.ItemDescription>{`preview text ${i} ${v}`}</F.ItemDescription>
				</F.ItemRow>
			</F.ItemContent>
		</F.Item>
	),
	// A sidebar room row as `Item` composes it today
	itemSidebar: (i, v) => (
		<F.Item key={i} is='a' href={`#${i}`} inset='md' selected={i === 0} highlighted={i % 3 === 0}>
			<F.ItemMedia>
				<span className='avatar' />
			</F.ItemMedia>
			<F.ItemContent>
				<F.ItemRow>
					<F.ItemTitle>{`room ${i}`}</F.ItemTitle>
					<F.ItemMeta>{`12:${v}0`}</F.ItemMeta>
				</F.ItemRow>
				<F.ItemRow>
					<F.ItemDescription>{`preview text ${i} ${v}`}</F.ItemDescription>
				</F.ItemRow>
			</F.ItemContent>
		</F.Item>
	),
	// The same row from pure parts, with what `Item` works out at runtime declared
	itemSidebarPure: (i, v) => (
		<PureItem
			key={i}
			render='a'
			href={`#${i}`}
			inset='md'
			selected={i === 0}
			highlighted={i % 3 === 0}
			surface={i === 0 ? 'selected' : 'interactive'}
			pointer='interactive'
			gap='x8'
		>
			<PureItemMedia>
				<span className='avatar' />
			</PureItemMedia>
			<PureItemContent>
				<PureItemRow>
					<PureItemTitle highlight={i % 3 === 0 ? 'item' : undefined}>{`room ${i}`}</PureItemTitle>
					<PureItemMeta highlight={i % 3 === 0 ? 'item' : undefined}>{`12:${v}0`}</PureItemMeta>
				</PureItemRow>
				<PureItemRow>
					<PureItemDescription highlight={i % 3 === 0 ? 'item' : undefined}>{`preview text ${i} ${v}`}</PureItemDescription>
				</PureItemRow>
			</PureItemContent>
		</PureItem>
	),
	// The pure row with its state picked by JSX branches, every element's props literal
	itemSidebarPureBranch: (i, v) => <PureRow key={i} i={i} v={v} />,
	// Ceiling: every row in the same state, nothing dynamic but text and href
	itemSidebarPureLiteral: (i, v) => (
		<PureItem key={i} render='a' href={`#${i}`} inset='md' surface='interactive' pointer='interactive' gap='x8'>
			<PureItemMedia>
				<span className='avatar' />
			</PureItemMedia>
			<PureItemContent>
				<PureItemRow>
					<PureItemTitle>{`room ${i}`}</PureItemTitle>
					<PureItemMeta>{`12:${v}0`}</PureItemMeta>
				</PureItemRow>
				<PureItemRow>
					<PureItemDescription>{`preview text ${i} ${v}`}</PureItemDescription>
				</PureItemRow>
			</PureItemContent>
		</PureItem>
	),
	// As the room list renders a row: actions that show on hover
	itemActions: (i, v) => (
		<F.Item key={i} is='li' highlighted={i % 3 === 0}>
			<F.ItemContent>
				<F.ItemRow>
					<F.ItemTitle>{`room ${i} ${v}`}</F.ItemTitle>
				</F.ItemRow>
			</F.ItemContent>
			<F.ItemActions reveal='hover'>
				<button type='button'>{`menu ${i}`}</button>
			</F.ItemActions>
		</F.Item>
	),
	message: (i, v) => (
		<Message key={i}>
			<MessageContainer>
				<MessageHeader>
					<MessageNameContainer>
						<MessageName>{`User ${i}`}</MessageName>
						<MessageUsername>{`@user${i}`}</MessageUsername>
					</MessageNameContainer>
					<MessageTimestamp>{`12:0${v}`}</MessageTimestamp>
				</MessageHeader>
				<MessageBody>{`Hello world ${i} ${v}`}</MessageBody>
			</MessageContainer>
		</Message>
	),
};

let reactMs = 0;
const onRender = (_id, _phase, actualDuration) => {
	reactMs += actualDuration;
};

const tree = (v) => {
	const list = Array.from({ length: n }, (_, i) => rows[scenario](i, v));
	return (
		<Profiler id='bench' onRender={onRender}>
			<Root>{scenario.startsWith('item') ? <F.ItemGroup is='ul'>{list}</F.ItemGroup> : <div>{list}</div>}</Root>
		</Profiler>
	);
};

const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const measure = async (render) => {
	reactMs = 0;
	const start = performance.now();
	flushSync(render);
	const commit = performance.now() - start;
	await frame();
	return { commit, frame: performance.now() - start, react: reactMs };
};

const run = async () => {
	const container = document.getElementById('root');
	let root = createRoot(container);
	const cold = await measure(() => root.render(tree(0)));
	// `pause=update` lets a profiler record the update alone
	const pause = (name) => params.get('pause') === 'update' && new Promise((resolve) => { window.__paused = name; window.__resume = resolve; });
	await pause('before-update');
	const update = await measure(() => root.render(tree(1)));
	await pause('after-update');
	// Later updates tell a one-time warm-up apart from a steady per-render cost
	const update2 = await measure(() => root.render(tree(3)));
	const update3 = await measure(() => root.render(tree(4)));
	const dom = container.querySelectorAll('*').length;
	const tamagui = container.querySelectorAll('.is_View, .is_Text').length;
	flushSync(() => root.unmount());
	root = createRoot(container);
	const warm = await measure(() => root.render(tree(2)));
	window.__result = {
		'cold mount ms': cold.commit,
		'cold mount + frame ms': cold.frame,
		'cold react ms': cold.react,
		'update ms': update.commit,
		'update react ms': update.react,
		'2nd update ms': update2.commit,
		'3rd update ms': update3.commit,
		'warm mount ms': warm.commit,
		'warm react ms': warm.react,
		'dom elements': dom,
		'tamagui elements': tamagui,
		'injected css chars': [...document.querySelectorAll('style')].reduce((n, el) => n + el.textContent.length, 0),
	};
};

run().catch((error) => {
	window.__result = { error: String(error?.stack ?? error) };
});
