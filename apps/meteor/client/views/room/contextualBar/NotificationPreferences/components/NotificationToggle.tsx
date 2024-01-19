import { Field, FieldLabel, FieldDescription, FieldGroup, ToggleSwitch, FieldRow } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

type NotificationToggleProps = {
	label: string;
	description?: string;
	onChange: (e: unknown) => void;
	defaultChecked: boolean;
};

const NotificationToggle = ({ label, description, onChange, defaultChecked }: NotificationToggleProps): ReactElement => {
	const fieldId = useUniqueId();

	return (
		<FieldGroup>
			<Field>
				<FieldRow>
					<FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
					<ToggleSwitch id={fieldId} aria-describedby={`${fieldId}-hint`} onChange={onChange} defaultChecked={defaultChecked} />
				</FieldRow>
				{description && <FieldDescription id={`${fieldId}-hint`}>{description}</FieldDescription>}
			</Field>
		</FieldGroup>
	);
};

export default memo(NotificationToggle);
