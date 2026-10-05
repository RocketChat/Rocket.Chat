import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box, Dropdown, Option } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { HeaderToolbarAction, useDropdownVisibility } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { QuickActionsActionOptions } from '../../../lib/quickActions';

export type QuickActionOptionsProps = {
	options: QuickActionsActionOptions;
	action: (id: string) => void;
	room: IOmnichannelRoom;
	icon: IconName;
};

const QuickActionOptions = ({ options, room, action, icon, ...props }: QuickActionOptionsProps) => {
	const { t } = useTranslation();
	const { isVisible, toggle, reference, target } = useDropdownVisibility<HTMLButtonElement>();

	const handleClick = (id: string) => (): void => {
		toggle();
		action(id);
	};

	return (
		<>
			<HeaderToolbarAction ref={reference} icon={icon} onClick={() => toggle()} secondary={isVisible} {...props} />
			{isVisible && (
				<Dropdown reference={reference} ref={target}>
					{options.map(({ id, label, validate }) => {
						const { value: valid = true, tooltip } = validate?.(room) || {};
						return (
							<Option key={id} onClick={handleClick(id)} disabled={!valid} title={!valid && tooltip ? t(tooltip) : undefined}>
								<Box fontScale='p2m' minWidth='180px'>
									{t(label)}
								</Box>
							</Option>
						);
					})}
				</Dropdown>
			)}
		</>
	);
};

export default memo(QuickActionOptions);
