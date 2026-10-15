import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import type { ChangeEvent, KeyboardEvent } from 'react';

type SidebarPanelSearchProps = {
	id: string;
	value: string;
	placeholder: string;
	onChange: (value: string) => void;
	/** Called on Esc, so the panel can close and clear the search. */
	onClose: () => void;
};

/** The search field a sidebar panel shows under its header while its search button is pressed. */
const SidebarPanelSearch = ({ id, value, placeholder, onChange, onClose }: SidebarPanelSearchProps) => (
	<Box paddingInline={16} paddingBlock={8} flexShrink={0}>
		<TextInput
			id={id}
			small
			autoFocus
			value={value}
			onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value)}
			onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => event.key === 'Escape' && onClose()}
			placeholder={placeholder}
			aria-label={placeholder}
			endAddon={<Icon name='magnifier' size='x16' />}
		/>
	</Box>
);

export default SidebarPanelSearch;
