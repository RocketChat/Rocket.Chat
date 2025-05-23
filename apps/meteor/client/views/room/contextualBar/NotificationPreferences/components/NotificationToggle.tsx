import { Field, FieldLabel, FieldDescription, FieldGroup, ToggleSwitch, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, Ref } from 'react';
import { forwardRef, memo, useId } from 'react';

type NotificationToggleProps = {
	label: string;
	description?: string;
	onChange: (e: unknown) => void;
	defaultChecked: boolean;
} & ComponentProps<typeof ToggleSwitch>;

const NotificationToggle = forwardRef(function NotificationToggle(
	{ label, description, onChange, defaultChecked, ...props }: NotificationToggleProps,
	ref: Ref<HTMLInputElement>,
): ReactElement {
	const fieldId = useId();

	return (
		<FieldGroup>
			<Field>
				<FieldRow>
					<FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
					<ToggleSwitch
						id={fieldId}
						aria-describedby={`${fieldId}-hint`}
						onChange={onChange}
						defaultChecked={defaultChecked}
						ref={ref}
						{...props}
					/>
				</FieldRow>
				{description && <FieldDescription id={`${fieldId}-hint`}>{description}</FieldDescription>}
			</Field>
		</FieldGroup>
	);
});

export default memo(NotificationToggle);
