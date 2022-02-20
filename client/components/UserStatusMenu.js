import { Button, PositionAnimated, Options, useCursor, Box } from '@rocket.chat/fuselage';
import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';

import { useSetting } from '../contexts/SettingsContext';
import { useTranslation } from '../contexts/TranslationContext';
import { UserStatus } from './UserStatus';

const UserStatusMenu = ({ onChange, optionWidth = undefined, initialStatus = 'offline', placement = 'bottom-end', ...props }) => {
	const t = useTranslation();
	const [status, setStatus] = useState(initialStatus);
	const allowInvisibleStatus = useSetting('Accounts_AllowInvisibleStatusOption');

	const options = useMemo(() => {
		const renderOption = (status, label) => (
			<Box display='flex' flexDirection='row' alignItems='center'>
				<Box marginInlineEnd='x8'>
					<UserStatus status={status} />
				</Box>
				{label}
			</Box>
		);

		const statuses = [
			['online', renderOption('online', t('Online'))],
			['away', renderOption('away', t('Away'))],
			['busy', renderOption('busy', t('Busy'))],
		];

		if (allowInvisibleStatus) {
			statuses.push(['offline', renderOption('offline', t('Invisible'))]);
		}

		return statuses;
	}, [t, allowInvisibleStatus]);

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

	const handleSelection = useCallback(
		([selected]) => {
			setStatus(selected);
			reset();
			hide();
		},
		[hide, reset],
	);

	useEffect(() => onChange(status), [status, onChange]);

	return (
		<>
			<Button ref={ref} small square ghost onClick={onClick} onBlur={hide} onKeyUp={handleKeyUp} onKeyDown={handleKeyDown} {...props}>
				<UserStatus status={status} />
			</Button>
			<PositionAnimated width='auto' visible={visible} anchor={ref} placement={placement}>
				<Options width={optionWidth} onSelect={handleSelection} options={options} cursor={cursor} />
			</PositionAnimated>
		</>
	);
};

export default UserStatusMenu;
