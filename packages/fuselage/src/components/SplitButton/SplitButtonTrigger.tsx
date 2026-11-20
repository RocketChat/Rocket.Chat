import { useContext } from 'react';

import { IconButton, type IconButtonProps } from '../Button';
import { SegmentContext, segmentValue } from '../Button/SegmentContext';

export type SplitButtonTriggerProps = IconButtonProps;

/**
 * The ghost segment of a `SplitButton`: the menu trigger fused next to the
 * primary action. Pass it as a `Menu`'s `button`.
 */
function SplitButtonTrigger({ className, ...props }: SplitButtonTriggerProps) {
	const segment = useContext(SegmentContext);

	return (
		<SegmentContext.Provider value={segment && segmentValue(segment.position, segment.tone, true)}>
			<IconButton {...props} className={['rcx-split-button__trigger', className].filter(Boolean).join(' ')} />
		</SegmentContext.Provider>
	);
}

export default SplitButtonTrigger;
