import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { ChangeEvent, KeyboardEvent } from 'react';

type SidebarPanelSearchProps = {
	id: string;
	value: string;
	placeholder: string;
	onChange: (value: string) => void;
	onClose: () => void;
};

const SidebarPanelSearch = ({ id, value, placeholder, onChange, onClose }: SidebarPanelSearchProps) => (
	<Box paddingInline='x16' paddingBlock='x8' flexShrink={0}>
		<TextInput
			id={id}
			small
			autoFocus
			value={value}
			onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value)}
			onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
				if (event.key === 'Escape') {
					onClose();
				}
			}}
			placeholder={placeholder}
			aria-label={placeholder}
			endAddon={<Icon name='magnifier' size='x16' />}
		/>
	</Box>
);

export default SidebarPanelSearch;
