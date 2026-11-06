import { InputBox } from '@rocket.chat/fuselage';
import { useFieldReferencedByInput } from '@rocket.chat/fuselage-forms';
import type { ComponentProps } from 'react';

type DateInputProps = Omit<ComponentProps<typeof InputBox>, 'type'>;

/** A date input that takes its field's label, as the forms package's inputs do; the package wraps no date input itself. */
const DateInput = (props: DateInputProps) => <InputBox type='date' {...props} {...useFieldReferencedByInput()} />;

export default DateInput;
