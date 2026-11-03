import './Editablelabel.scss';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Input, fontScale, useStyle, type FontScale } from '@rocket.chat/fuselage';
import { type MouseEventHandler, type ComponentProps, useRef } from 'react';

type EditableLabelProps = ComponentProps<typeof Input> & {
	/** The typography of the label, which the input renders in place. */
	fontScale?: FontScale;
};

const EditableLabel = ({ fontScale: scale, className, ...props }: EditableLabelProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const typography = scale ? fontScale(scale) : undefined;
	const scaleClassName = useStyle(
		typography
			? css`
					font-size: ${typography.fontSize} !important;
					font-weight: ${typography.fontWeight} !important;
					letter-spacing: ${typography.letterSpacing} !important;
					line-height: ${typography.lineHeight} !important;
				`
			: undefined,
	);

	const iconClickHandler: MouseEventHandler<HTMLElement> = (e) => {
		e.stopPropagation();
		inputRef.current?.focus();
		inputRef.current?.select();
	};

	return (
		<Box position='relative' className='rc-editableLabel' width='100%' height='max-content' display='flex' alignItems='center'>
			<Input ref={inputRef} {...props} className={[className, scaleClassName].filter(Boolean).join(' ')} />
			<Icon className='editableLabel-icon' name='pencil' onClick={iconClickHandler} />
		</Box>
	);
};

export default EditableLabel;
