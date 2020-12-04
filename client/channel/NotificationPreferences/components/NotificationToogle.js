import React from 'react';
import { Box, Field, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

export const NotificationToogle = React.memo(({ label, description, onChange, defaultChecked }) => {
	const id = useUniqueId();

	return <FieldGroup>
		<Box display='flex' justifyContent='space-between' alignItems='start'>
			<Box display='flex' flexDirection='column'>
				<Field.Label for={id}>{label}</Field.Label>
				<Field.Description>{description}</Field.Description>
			</Box>
			<ToggleSwitch id={id} onChange={onChange} defaultChecked={defaultChecked} />
		</Box>
	</FieldGroup>;
});
