import { Field, FieldLabel, FieldDescription, FieldGroup, ToggleSwitch, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useId } from 'react';

type NotificationToggleProps = {
	label: string;
	description?: string;
	onChange: (e: unknown) => void;
} & ComponentProps<typeof ToggleSwitch>;

const NotificationToggle = ({ label, description, onChange, ...props }: NotificationToggleProps): ReactElement => {
	const fieldId = useId();

	return (
		<FieldGroup>
			<Field>
				<FieldRow>
					<FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
					<ToggleSwitch id={fieldId} aria-describedby={`${fieldId}-hint`} onChange={onChange} {...props} />
				</FieldRow>
				{description && <FieldDescription id={`${fieldId}-hint`}>{description}</FieldDescription>}
			</Field>
		</FieldGroup>
	);
};

export default memo(NotificationToggle);
