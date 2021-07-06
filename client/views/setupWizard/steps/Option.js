import { Box, Field, RadioButton } from '@rocket.chat/fuselage';
import { useMergedRefs, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, useRef } from 'react';

const Option = forwardRef(function Option({ children, label, selected, disabled, ...props }, ref) {
	const innerRef = useRef();
	const mergedRef = useMergedRefs(ref, innerRef);
	const id = useUniqueId();

	return (
		<Box
			className={[
				'SetupWizard__RegisterServerStep-option',
				selected && 'SetupWizard__RegisterServerStep-option--selected',
			]
				.filter(Boolean)
				.join(' ')}
			display='block'
			marginBlock='x8'
			padding='x24'
			color={selected ? 'primary' : 'disabled'}
			style={{
				borderColor: 'currentColor',
				borderRadius: 2,
				borderWidth: 2,
				cursor: 'pointer',
				...(disabled && { opacity: 0.25 }),
			}}
			onClick={() => {
				innerRef.current.click();
			}}
		>
			<Field>
				<Field.Row>
					<RadioButton ref={mergedRef} id={id} checked={selected} disabled={disabled} {...props} />
					<Field.Label htmlFor={id}>{label}</Field.Label>
				</Field.Row>
			</Field>
			{children}
		</Box>
	);
});

export default Option;
