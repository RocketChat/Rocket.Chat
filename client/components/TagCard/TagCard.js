import { AnimatedVisibility, Button, PositionAnimated } from '@rocket.chat/fuselage';
import { useDebouncedState, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useRef, useCallback } from 'react';

import TagsTile from './TagsTile';

const TagCard = ({
	onChange = () => {},
	onSelect = () => {},
	tags,
	placement = 'top-start',
	...props
}) => {
	const [visible, setVisible] = useDebouncedState(AnimatedVisibility.HIDDEN, 10);
	const hide = useMutableCallback(() => setVisible(AnimatedVisibility.HIDDEN));
	const show = useMutableCallback(() => setVisible(AnimatedVisibility.VISIBLE));

	const ref = useRef();
	const onClick = useCallback(() => {
		ref.current.focus() & show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	return (
		<>
			<Button
				ref={ref}
				small
				square
				fontWeight='normal'
				color='info'
				onClick={onClick}
				onBlur={hide}
				title={`+${tags.length} Tags`}
				aria-label={`+${tags.length} Tags`}
				{...props}
			>
				{`+${tags.length}`}
			</Button>
			<PositionAnimated width='auto' visible={visible} anchor={ref} placement={placement}>
				<TagsTile tags={tags} onChange={onChange} onSelect={onSelect} />
			</PositionAnimated>
		</>
	);
};

export default TagCard;
