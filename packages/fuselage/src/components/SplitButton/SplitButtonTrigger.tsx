import { IconButton, type IconButtonProps } from '../Button';

export type SplitButtonTriggerProps = IconButtonProps;

/**
 * The ghost segment of a `SplitButton`: the menu trigger fused next to the
 * primary action. Pass it as a `Menu`'s `button`.
 */
function SplitButtonTrigger(props: SplitButtonTriggerProps) {
	return <IconButton rcx-split-button__trigger {...props} />;
}

export default SplitButtonTrigger;
