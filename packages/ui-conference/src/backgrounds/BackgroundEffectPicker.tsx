import { Stack } from '@rocket.chat/fuselage';

import EffectGrid from './EffectGrid';
import { effectKey } from './effectEntries';
import { useEffectEntryGroups } from './useEffectEntryGroups';
import { useImageFilePicker } from './useImageFilePicker';
import { useBackgroundEffectSelection } from '../devices/BackgroundEffectContext';

/** Every background effect as one single choice, grouped in grids. */
const BackgroundEffectPicker = () => {
	const { effect, applying, select, addImage } = useBackgroundEffectSelection();
	const { groups, focusCustomTile } = useEffectEntryGroups();
	const filePicker = useImageFilePicker({ onPick: addImage, onClose: focusCustomTile });

	const selectedKey = effectKey(effect);
	const applyingKey = applying ? effectKey(applying) : undefined;

	return (
		<>
			<Stack gap={20}>
				{groups.map((group) => (
					<EffectGrid
						key={group.key}
						group={group}
						selectedKey={group.entries.some((entry) => entry.key === selectedKey) ? selectedKey : undefined}
						applyingKey={applyingKey}
						disabled={!!applying}
						onChoose={(entry) => (entry.effect ? select(entry.effect) : filePicker.open())}
					/>
				))}
			</Stack>
			<input {...filePicker.inputProps} />
		</>
	);
};

export default BackgroundEffectPicker;
