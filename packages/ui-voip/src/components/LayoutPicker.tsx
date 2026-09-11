import { Box, RadioButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';

import { ActionButton } from '.';
import type { StageLayout } from '../views/MediaCallRoomSection/CallStage';

const LAYOUTS: StageLayout[] = ['grid', 'spotlight', 'sidebar'];

const LAYOUT_ICONS: Record<StageLayout, string> = {
	grid: 'squares',
	spotlight: 'user',
	sidebar: 'stack',
};

const LAYOUT_LABELS: Record<StageLayout, string> = {
	grid: 'Grid',
	spotlight: 'Spotlight',
	sidebar: 'Sidebar',
};

type LayoutPickerProps = {
	layout: StageLayout;
	onLayoutChange: (layout: StageLayout) => void;
};

const LayoutPicker = ({ layout, onLayoutChange }: LayoutPickerProps) => {
	const items: GenericMenuItemProps[] = LAYOUTS.map((l) => ({
		id: l,
		textValue: LAYOUT_LABELS[l],
		icon: LAYOUT_ICONS[l] as any,
		content: (
			<Box is='span' title={LAYOUT_LABELS[l]} fontSize={14}>
				{LAYOUT_LABELS[l]}
			</Box>
		),
		addon: <RadioButton checked={layout === l} readOnly />,
	}));

	return (
		<GenericMenu
			title='Layout'
			items={items}
			placement='top-end'
			selectionMode='multiple'
			onAction={(id) => {
				if (typeof id === 'string' && LAYOUTS.includes(id as StageLayout)) {
					onLayoutChange(id as StageLayout);
				}
			}}
			button={<ActionButton secondary label='Layout' icon={LAYOUT_ICONS[layout] as any} />}
		/>
	);
};

export default LayoutPicker;
