import './Editablelabel.scss';
import { Box, Icon, Input } from '@rocket.chat/fuselage';
import { type MouseEventHandler, type ComponentProps, useRef } from 'react';

const EditableLabel = (props: ComponentProps<typeof Input>) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const iconClickHandler: MouseEventHandler<HTMLElement> = (e) => {
		e.stopPropagation();
		inputRef.current?.focus();
		inputRef.current?.select();
	};

	return (
		<Box position='relative' className='rc-editableLabel' width='100%' height='max-content' display='flex' alignItems='center'>
			<Input ref={inputRef} {...props} />
			<Icon className='editableLabel-icon' name='pencil' onClick={iconClickHandler} />
		</Box>
	);
};

export default EditableLabel;
