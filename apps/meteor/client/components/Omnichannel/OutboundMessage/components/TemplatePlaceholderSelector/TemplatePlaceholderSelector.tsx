import type { ILivechatAgent, Serialized } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

import { useContactSection } from './hooks/useContactSection';

type PlaceholderSelectorProps = Pick<ComponentProps<typeof Button>, 'mis'> & {
	contact: Serialized<ILivechatContactWithManagerData>;
	agent?: Serialized<ILivechatAgent>;
	onSelect(value: string): void;
};

const PlaceholderSelector = ({ contact, onSelect, ...props }: PlaceholderSelectorProps) => {
	const contactSection = useContactSection({ contact, onSelect });

	return (
		<GenericMenu
			button={<Button {...props}>Placeholder</Button>}
			icon={undefined}
			title=''
			disabled={false}
			maxWidth='100%'
			sections={contactSection}
			placement='bottom-end'
		/>
	);
};

export default PlaceholderSelector;
