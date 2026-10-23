import { useContext } from 'react';

import { IconButton, type IconButtonProps } from '../Button';
import { ButtonSegmentContext } from '../Button/ButtonSegmentContext';

export type SplitButtonTriggerProps = IconButtonProps;

/**
 * The ghost segment of a `SplitButton`: the menu trigger fused next to the
 * primary action. Pass it as a `Menu`'s `button`.
 */
function SplitButtonTrigger({ className, ...props }: SplitButtonTriggerProps) {
	const segment = useContext(ButtonSegmentContext);
	const button = (
		<IconButton {...props} className={['rcx-split-button__trigger', ...(Array.isArray(className) ? className : [className])]} />
	);

	if (!segment) {
		return button;
	}

	return <ButtonSegmentContext.Provider value={{ ...segment, ghost: true }}>{button}</ButtonSegmentContext.Provider>;
}

export default SplitButtonTrigger;
