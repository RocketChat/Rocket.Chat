import { Box, Field, FieldLabel, FieldDescription, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
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
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
						{description && <FieldDescription id={`${fieldId}-hint`}>{description}</FieldDescription>}
					</Box>
					<ToggleSwitch id={fieldId} aria-describedby={`${fieldId}-hint`} onChange={onChange} defaultChecked={defaultChecked} />
				</Box>
			</Field>
		</FieldGroup>
	);
};

export default memo(NotificationToggle);
