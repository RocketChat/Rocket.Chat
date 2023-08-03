import { Box, Field, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

type NotificationToogleProps = {
	label: string;
	description?: string;
	onChange: (e: unknown) => void;
	defaultChecked: boolean;
};

const NotificationToogle = ({ label, description, onChange, defaultChecked }: NotificationToogleProps): ReactElement => {
	const id = useUniqueId();

	return (
		<FieldGroup>
			<Box display='flex' justifyContent='space-between' alignItems='start'>
				<Box display='flex' flexDirection='column'>
					<Field.Label htmlFor={id}>{label}</Field.Label>
					{description && <Field.Description>{description}</Field.Description>}
				</Box>
				<ToggleSwitch id={id} onChange={onChange} defaultChecked={defaultChecked} />
			</Box>
		</FieldGroup>
	);
};

export default memo(NotificationToogle);
