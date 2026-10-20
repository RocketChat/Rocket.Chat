import * as F from 'fuselage-under-test';
import 'fuselage-under-test-css';
import { Profiler } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

const params = new URLSearchParams(location.search);
const scenario = params.get('scenario');
const n = Number(params.get('n'));
const withRoot = params.get('root') === '1';

const Root = withRoot && F.FuselageProvider ? F.FuselageProvider : ({ children }) => children;

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
	message: (i, v) => (
		<F.Message key={i}>
			<F.MessageContainer>
				<F.MessageHeader>
					<F.MessageNameContainer>
						<F.MessageName>{`User ${i}`}</F.MessageName>
						<F.MessageUsername>{`@user${i}`}</F.MessageUsername>
					</F.MessageNameContainer>
					<F.MessageTimestamp>{`12:0${v}`}</F.MessageTimestamp>
				</F.MessageHeader>
				<F.MessageBody>{`Hello world ${i} ${v}`}</F.MessageBody>
			</F.MessageContainer>
		</F.Message>
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
			<Root>{scenario === 'item' ? <F.ItemGroup is='ul'>{list}</F.ItemGroup> : <div>{list}</div>}</Root>
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
	const update = await measure(() => root.render(tree(1)));
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
		'warm mount ms': warm.commit,
		'warm react ms': warm.react,
		'dom elements': dom,
		'tamagui elements': tamagui,
	};
};

run().catch((error) => {
	window.__result = { error: String(error?.stack ?? error) };
});
