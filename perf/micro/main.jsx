// Cost of one Tamagui frame by shape, without Fuselage: how much the frame itself, its style props, state clauses,
// variants and group subscriptions each add per element.
import { createTamagui, createTokens, styled, TamaguiProvider, Text, View } from '@tamagui/web';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

const config = createTamagui({
	tokens: createTokens({ color: {}, space: {}, size: {}, radius: {}, zIndex: {} }),
	themes: { light: {} },
	settings: { addThemeClassName: false },
});

const params = new URLSearchParams(location.search);
const scenario = params.get('scenario');
const n = Number(params.get('n'));

const props16 = {
	position: 'relative',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 0,
	minHeight: 'auto',
	margin: 0,
	padding: '0.25rem',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	borderRadius: '0.125rem',
	fontFamily: 'Inter, sans-serif',
	fontVariant: 'tabular-nums',
	boxSizing: 'border-box',
	color: 'var(--rcx-color-font-default, #2f343d)',
};
const props4 = { display: 'flex', flexDirection: 'row', padding: '0.25rem', color: 'var(--rcx-color-font-default, #2f343d)' };

const Empty = styled(View, { render: 'div' });
const Four = styled(View, { render: 'div', ...props4 });
const Sixteen = styled(View, { render: 'div', ...props16 });
const SixteenStates = styled(View, {
	render: 'div',
	...props16,
	backgroundColor: { default: 'transparent', hover: '#eee', press: '#ddd' },
	outlineColor: { 'default': 'transparent', 'focus-visible': 'blue' },
	boxShadow: { 'focus-visible': '0 0 0 2px blue' },
});
const FourVariants = styled(View, {
	render: 'div',
	...props4,
	variants: {
		selected: { true: { backgroundColor: '#eee' } },
		size: { small: { padding: '0.125rem' }, large: { padding: '0.5rem' } },
		disabled: { true: { opacity: 0.5 } },
	},
});
const GroupParent = styled(View, { render: 'div', group: 'row', ...props4 });
const GroupChild = styled(Text, { render: 'span', color: { 'default': '#333', 'group-hover/row': '#000' } });
const PlainChild = styled(Text, { render: 'span', color: '#333' });
// The 11 reset-like declarations of `props16` moved to one static class, as a shared primitive would
const { position, display, flexDirection, alignItems, color } = props16;
const FiveWithClass = styled(View, { render: 'div', position, display, flexDirection, alignItems, color });

// Does a variant reach the DOM as a class name, the way `rcx-x--small` modifier classes need?
const WithVariantClass = styled(View, {
	render: 'div',
	variants: {
		// The base class as an always-on variant, so a consumer's `className` adds to it instead of replacing it
		rcx: { true: { className: 'rcx-x' } },
		small: { true: { className: 'rcx-x--small', padding: '0.125rem' } },
	},
	defaultVariants: { rcx: true },
});

const rows = {
	variantClass: (i, v) => (
		<WithVariantClass key={i} small={i % 2 === 0} className={i % 2 === 0 ? 'consumer' : undefined}>
			{`row ${i} ${v}`}
		</WithVariantClass>
	),
	div: (i, v) => <div key={i} className='row'>{`row ${i} ${v}`}</div>,
	empty: (i, v) => <Empty key={i}>{`row ${i} ${v}`}</Empty>,
	four: (i, v) => <Four key={i}>{`row ${i} ${v}`}</Four>,
	sixteen: (i, v) => <Sixteen key={i}>{`row ${i} ${v}`}</Sixteen>,
	sixteenStates: (i, v) => <SixteenStates key={i}>{`row ${i} ${v}`}</SixteenStates>,
	fourVariants: (i, v) => (
		<FourVariants key={i} selected={i % 2 === 0} size={v % 2 ? 'small' : 'large'}>
			{`row ${i} ${v}`}
		</FourVariants>
	),
	// Two frames per row: compare with `plainPair` to isolate the group subscription
	groupPair: (i, v) => (
		<GroupParent key={i}>
			<GroupChild>{`row ${i} ${v}`}</GroupChild>
		</GroupParent>
	),
	sixteenAsClass: (i, v) => (
		<FiveWithClass key={i} className='reset'>
			{`row ${i} ${v}`}
		</FiveWithClass>
	),
	groupParentOnly: (i, v) => (
		<GroupParent key={i}>
			<PlainChild>{`row ${i} ${v}`}</PlainChild>
		</GroupParent>
	),
	plainPair: (i, v) => (
		<Four key={i}>
			<PlainChild>{`row ${i} ${v}`}</PlainChild>
		</Four>
	),
};

const tree = (v) => (
	<TamaguiProvider config={config} defaultTheme='light'>
		<div>{Array.from({ length: n }, (_, i) => rows[scenario](i, v))}</div>
	</TamaguiProvider>
);

const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const measure = async (render) => {
	const start = performance.now();
	flushSync(render);
	const commit = performance.now() - start;
	await frame();
	return commit;
};

const run = async () => {
	const container = document.getElementById('root');
	let root = createRoot(container);
	const cold = await measure(() => root.render(tree(0)));
	const update = await measure(() => root.render(tree(1)));
	flushSync(() => root.unmount());
	root = createRoot(container);
	const warm = await measure(() => root.render(tree(2)));
	window.__result = { 'cold mount ms': cold, 'update ms': update, 'warm mount ms': warm };
};

run().catch((error) => {
	window.__result = { error: String(error?.stack ?? error) };
});
