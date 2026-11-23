import { useGridListItem } from '@react-aria/gridlist';
import type { ListState } from '@react-stately/list';
import { IconButton, Throbber } from '@rocket.chat/fuselage';
import { useMergedRefsV2 } from '@rocket.chat/ui-client';
import type { SyntheticEvent } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { EffectEntry } from './effectEntries';
import EffectTile from './layout/EffectTile';

type GridNode = Parameters<typeof useGridListItem<EffectEntry>>[0]['node'];

export type EffectGridItemProps = { node: GridNode; state: ListState<EffectEntry>; applying: boolean };

const keepFromTile = (event: SyntheticEvent) => event.stopPropagation();

const EffectGridItem = ({ node, state, applying }: EffectGridItemProps) => {
	const { t } = useTranslation();
	const ref = useRef<HTMLDivElement>(null);
	const { rowProps, gridCellProps, isSelected, isDisabled } = useGridListItem({ node }, state, ref);
	const entry = node.value as EffectEntry;
	const { onRemove } = entry;
	const tileRef = useMergedRefsV2(ref, entry.tileRef);
	const tileFocused = state.selectionManager.focusedKey === node.key;

	return (
		<EffectTile
			{...rowProps}
			cellProps={gridCellProps}
			ref={tileRef}
			label={entry.label}
			thumbnail={entry.thumbnail}
			selected={isSelected}
			disabled={isDisabled}
			note={applying ? t('Starting') : entry.note}
			busy={applying ? <Throbber size='x8' inheritColor /> : undefined}
			action={
				onRemove && (
					<IconButton
						icon='trash'
						size='tiny'
						variant='secondary-danger'
						title={t('Remove')}
						aria-label={t('Remove_background_image', { name: entry.label })}
						tabIndex={tileFocused ? 0 : -1}
						disabled={isDisabled}
						// Keeps the press from also choosing the tile.
						onPointerDown={keepFromTile}
						onPointerUp={keepFromTile}
						onMouseDown={keepFromTile}
						onKeyDown={keepFromTile}
						onClick={(event) => {
							event.stopPropagation();
							onRemove();
						}}
					/>
				)
			}
		/>
	);
};

export default EffectGridItem;
