import { IconButton, type IconButtonProps } from '../Button';

export type SplitButtonTriggerProps = IconButtonProps;

/**
 * The ghost segment of a `SplitButton`: the menu trigger fused next to the
 * primary action. Pass it as a `Menu`'s `button`.
 */
function SplitButtonTrigger({ className, ...props }: SplitButtonTriggerProps) {
	return <IconButton {...props} className={['rcx-split-button__trigger', className].filter(Boolean).join(' ')} />;
}

export default SplitButtonTrigger;
