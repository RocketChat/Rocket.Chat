import { UserStatus as UserStatusType } from '@rocket.chat/core-typings';
import { Button, PositionAnimated, Options, useCursor, Box } from '@rocket.chat/fuselage';
import type { Placements } from '@rocket.chat/fuselage-hooks';
import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';

import { useSetting } from '../contexts/SettingsContext';
import { useTranslation } from '../contexts/TranslationContext';
import { UserStatus } from './UserStatus';

type UserStatusMenuProps = {
	margin: string;
	onChange: (type: UserStatusType) => void;
	initialStatus?: UserStatusType;
	optionWidth?: any;
	placement?: Placements;
};

const UserStatusMenu = ({
	margin,
	onChange,
	initialStatus = UserStatusType.OFFLINE,
	optionWidth = undefined,
	placement = 'bottom-end',
}: UserStatusMenuProps): React.ReactElement => {
	const t = useTranslation();
	const [status, setStatus] = useState<UserStatusType>(initialStatus);
	const allowInvisibleStatus = useSetting('Accounts_AllowInvisibleStatusOption') as boolean;

	const options = useMemo(() => {
		const renderOption = (status: UserStatusType, label: string): React.ReactElement => (
			<Box display='flex' flexDirection='row' alignItems='center'>
				<Box marginInlineEnd='x8'>
					<UserStatus status={status} />
				</Box>
				{label}
			</Box>
		);

		const statuses: Array<[value: UserStatusType, label: React.ReactElement]> = [
			[UserStatusType.ONLINE, renderOption(UserStatusType.ONLINE, t('Online'))],
			[UserStatusType.AWAY, renderOption(UserStatusType.AWAY, t('Away'))],
			[UserStatusType.BUSY, renderOption(UserStatusType.BUSY, t('Busy'))],
		];

		if (allowInvisibleStatus) {
			statuses.push([UserStatusType.OFFLINE, renderOption(UserStatusType.OFFLINE, t('Invisible'))]);
		}

		return statuses;
	}, [t, allowInvisibleStatus]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setStatus(selected);
		reset();
		hide();
	});

	const ref = useRef<HTMLElement>(null);
	const onClick = useCallback(() => {
		if (!ref?.current) {
			return;
		}
		(ref.current as HTMLButtonElement).focus();
		show();
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
			<Button ref={ref} small square ghost onClick={onClick} onBlur={hide} onKeyUp={handleKeyUp} onKeyDown={handleKeyDown} margin={margin}>
				<UserStatus status={status} />
			</Button>
			<PositionAnimated width='auto' visible={visible} anchor={ref} placement={placement}>
				<Options width={optionWidth} onSelect={handleSelection} options={options} cursor={cursor} />
			</PositionAnimated>
		</>
	);
};

export default UserStatusMenu;
