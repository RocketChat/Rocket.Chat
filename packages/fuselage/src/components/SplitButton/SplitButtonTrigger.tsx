import { IconButton, type IconButtonProps } from '../Button';

export type SplitButtonTriggerProps = IconButtonProps;

/**
 * Opens the menu of a `SplitButton`, as a see-through segment fused to the action. Pass it as a `Menu`'s `button`.
 */
function SplitButtonTrigger({ className, ...props }: SplitButtonTriggerProps) {
	return <IconButton {...props} className={['rcx-split-button__trigger', className].filter(Boolean).join(' ')} />;
}

export default SplitButtonTrigger;
