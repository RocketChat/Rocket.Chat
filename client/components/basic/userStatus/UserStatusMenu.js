import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import {
	Button,
	PositionAnimated,
	Margins,
	Options,
	useCursor,
	Box,
} from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import UserStatus from './UserStatus';

const UserStatusMenu = ({
	onChange = () => {},
	optionWidth,
	initialStatus = 'offline',
	placement = 'bottom-end',
	...props
}) => {
	const t = useTranslation();

	const [status, setStatus] = useState(initialStatus);

	const options = useMemo(() => {
		const renderOption = (status, label) => <Box display='flex' flexDirection='row' alignItems='center'>
			<Margins inlineEnd='x8'>
				<UserStatus status={status} />
			</Margins>
			{label}
		</Box>;

		return [
			['online', renderOption('online', t('Online'))],
			['busy', renderOption('busy', t('Busy'))],
			['away', renderOption('away', t('Away'))],
			['offline', renderOption('offline', t('Invisible'))],
		];
	}, [t]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setStatus(selected);
		reset();
		hide();
	});

	const ref = useRef();
	const onClick = useCallback(() => {
		ref.current.focus() & show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	const handleSelection = useCallback(([selected]) => {
		setStatus(selected);
		reset();
		hide();
	}, [hide, reset]);

	useEffect(() => onChange(status), [status, onChange]);

	return (
		<>
			<Button
				ref={ref}
				small
				ghost
				onClick={onClick}
				onBlur={hide}
				onKeyUp={handleKeyUp}
				onKeyDown={handleKeyDown}
				{...props}
			>
				<UserStatus status={status}/>
			</Button>
			<PositionAnimated
				width='auto'
				visible={visible}
				anchor={ref}
				placement={placement}
			>
				<Options
					width={optionWidth}
					onSelect={handleSelection}
					options={options}
					cursor={cursor}
				/>
			</PositionAnimated>
		</>
	);
};

export default UserStatusMenu;
