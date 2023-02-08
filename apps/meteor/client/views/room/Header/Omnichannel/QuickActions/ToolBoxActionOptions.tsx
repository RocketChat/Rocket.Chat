import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box, Option } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation, useLayout } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo, useRef } from 'react';

import { useDropdownVisibility } from '../../../../../sidebar/header/hooks/useDropdownVisibility';
import type { QuickActionsActionOptions } from '../../../lib/QuickActions';
import DesktopToolboxDropdown from './DesktopToolboxDropdown';
import MobileToolboxDropdown from './MobileToolboxDropdown';

type ToolBoxActionOptionsProps = {
	options: QuickActionsActionOptions;
	action: (id: string) => void;
	room: IOmnichannelRoom;
};

const ToolBoxActionOptions: FC<ToolBoxActionOptionsProps> = ({ options, room, action, ...props }) => {
	const t = useTranslation();
	const reference = useRef(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });
	const { isMobile } = useLayout();

	const Dropdown = isMobile ? MobileToolboxDropdown : DesktopToolboxDropdown;

	const handleClick = (id: string) => (): void => {
		toggle();
		action(id);
	};

	return (
		<>
			<Header.ToolBox.Action ref={reference} onClick={(): void => toggle()} secondary={isVisible} {...props} />
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

export default memo(ToolBoxActionOptions);
