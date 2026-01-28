import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import ActionButton from '../ActionButton';

type DevicePickerButtonProps = {
    secondary?: boolean;
    small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// GenericMenu for some reason passes `small: true` when the button is disabled (??)
// so this is just a wrapper to stop that from happening.
const DevicePickerButton = forwardRef<HTMLButtonElement, DevicePickerButtonProps>(function DevicePickerButton(
    { secondary = false, small: _small, ...props },
    ref,
) {
    return <ActionButton secondary={secondary} {...props} label='customize' icon='customize' ref={ref} />;
});

export default DevicePickerButton;
