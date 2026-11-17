import { useGridList } from '@react-aria/gridlist';
import { useCollator, useLocale } from '@react-aria/i18n';
import { ListKeyboardDelegate } from '@react-aria/selection';
import { Item } from '@react-stately/collections';
import { useListState } from '@react-stately/list';
import type { Key } from 'react';
import { useId, useMemo, useRef } from 'react';

import EffectGridItem from './EffectGridItem';
import type { EffectEntry, EffectEntryGroup } from './effectEntries';
import EffectTileGroup from './layout/EffectTileGroup';

type EffectGridProps = {
	group: EffectEntryGroup;
	selectedKey?: string;
	applyingKey?: string;
	disabled: boolean;
	onChoose: (entry: EffectEntry) => void;
};

/** Tab reaches the focused tile's own button before leaving the grid. */
const EffectGrid = ({ group, selectedKey, applyingKey, disabled, onChoose }: EffectGridProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const headingId = useId();
	const entries = useMemo(() => new Map(group.entries.map((entry) => [entry.key, entry])), [group.entries]);

	const state = useListState<EffectEntry>({
		items: group.entries,
		children: (entry) => (
			<Item key={entry.key} textValue={entry.label}>
				{entry.label}
			</Item>
		),
		selectionMode: 'single',
		selectionBehavior: 'toggle',
		selectedKeys: selectedKey ? [selectedKey] : [],
		disabledKeys: disabled ? [...entries.keys()] : [],
		disabledBehavior: 'all',
		onSelectionChange: (keys) => {
			if (keys === 'all') {
				return;
			}
			// Choosing the tile in use again keeps it selected.
			const [key] = [...keys] as Key[];
			const chosen = entries.get(String(key ?? selectedKey));
			if (chosen && chosen.key !== selectedKey) {
				onChoose(chosen);
			}
		},
	});

	const collator = useCollator({ usage: 'search', sensitivity: 'base' });
	const { direction } = useLocale();
	const keyboardDelegate = useMemo(
		() =>
			new ListKeyboardDelegate({
				collection: state.collection,
				ref,
				collator,
				layout: 'grid',
				orientation: 'vertical',
				direction,
				disabledKeys: state.disabledKeys,
				disabledBehavior: 'all',
			}),
		[state.collection, state.disabledKeys, collator, direction],
	);
	const { gridProps } = useGridList({ 'aria-labelledby': headingId, keyboardDelegate, 'keyboardNavigationBehavior': 'tab' }, state, ref);

	return (
		<EffectTileGroup {...gridProps} ref={ref} heading={group.title} headingId={headingId}>
			{[...state.collection].map((node) => (
				<EffectGridItem key={node.key} node={node} state={state} applying={node.key === applyingKey} />
			))}
		</EffectTileGroup>
	);
};

export default EffectGrid;
