import { UserStatus as UserStatusType } from '@rocket.chat/core-typings';
import type { OptionType } from '@rocket.chat/fuselage';
import { Button, PositionAnimated, Options, useCursor, Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { UserStatus } from './UserStatus';

type UserStatusMenuProps = {
	margin: ComponentProps<typeof Box>['margin'];
	onChange: (type: UserStatusType) => void;
	initialStatus?: UserStatusType;
	optionWidth?: ComponentProps<typeof Box>['width'];
	placement?: ComponentProps<typeof PositionAnimated>['placement'];
};

const UserStatusMenu = ({
	margin,
	onChange,
	initialStatus = UserStatusType.OFFLINE,
	optionWidth = undefined,
	placement = 'bottom-end',
}: UserStatusMenuProps): ReactElement => {
	const { t } = useTranslation();
	const [status, setStatus] = useState(initialStatus);
	const allowInvisibleStatus = useSetting('Accounts_AllowInvisibleStatusOption', true);

	const options = useMemo(() => {
		const renderOption = (status: UserStatusType, label: string): ReactElement => (
			<Box display='flex' flexDirection='row' alignItems='center'>
				<Box marginInlineEnd={8}>
					<UserStatus status={status} />
				</Box>
				{label}
			</Box>
		);

		const statuses: Array<[value: UserStatusType, label: ReactElement]> = [
			[UserStatusType.ONLINE, renderOption(UserStatusType.ONLINE, t('Online'))],
			[UserStatusType.AWAY, renderOption(UserStatusType.AWAY, t('Away'))],
			[UserStatusType.BUSY, renderOption(UserStatusType.BUSY, t('Busy'))],
		];

		if (allowInvisibleStatus) {
			statuses.push([UserStatusType.OFFLINE, renderOption(UserStatusType.OFFLINE, t('Offline'))]);
		}

		return statuses;
	}, [t, allowInvisibleStatus]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setStatus(selected);
		reset();
		hide();
	});

	const ref = useRef<HTMLButtonElement>(null);
	const onClick = useCallback(() => {
		if (!ref?.current) {
			return;
		}
		ref.current.focus();
		show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	const handleSelection = useCallback(
		([selected]: OptionType) => {
			setStatus(selected as UserStatusType);
			reset();
			hide();
		},
		[hide, reset],
	);

	useEffect(() => onChange(status), [status, onChange]);

	return (
		<>
			<Button
				ref={ref}
				small
				square
				secondary
				onClick={onClick}
				onBlur={hide}
				onKeyUp={handleKeyUp}
				onKeyDown={handleKeyDown}
				margin={margin}
				aria-label={t('User_status_menu')}
			>
				<UserStatus status={status} />
			</Button>
			<PositionAnimated width='auto' visible={visible} anchor={ref} placement={placement}>
				<Options width={optionWidth} onSelect={handleSelection} options={options} cursor={cursor} />
			</PositionAnimated>
		</>
	);
};

export default UserStatusMenu;
