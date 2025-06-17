import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { useId } from 'react';

type PreviewItemProps = {
	label: string;
	icon: Keys;
	children: ReactNode;
};

const PreviewItem = ({ icon, label, children }: PreviewItemProps) => {
	const id = useId();

	return (
		<Box display='flex'>
			<Icon size={18} name={icon} />
			<Box mis={6}>
				<Box is='span' id={id} fontScale='p2m'>
					{label}
				</Box>
				<div aria-labelledby={id}>{children}</div>
			</Box>
		</Box>
	);
};

export default PreviewItem;
