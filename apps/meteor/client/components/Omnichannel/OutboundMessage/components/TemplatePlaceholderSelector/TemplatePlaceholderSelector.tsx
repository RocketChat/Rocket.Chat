import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import type { Button } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

import PlaceholderButton from './TemplatePlaceholderButton';
import { useAgentSection } from './hooks/useAgentSection';
import { useContactSection } from './hooks/useContactSection';
import { useCustomFieldsSection } from './hooks/useCustomFieldsSection';

type PlaceholderSelectorProps = Pick<ComponentProps<typeof Button>, 'mis' | 'disabled'> & {
	contact?: Serialized<ILivechatContact>;
	onSelect(value: string): void;
};

const TemplatePlaceholderSelector = ({ contact, disabled, onSelect, ...props }: PlaceholderSelectorProps) => {
	const contactSection = useContactSection({ contact, onSelect });
	const customFieldsSection = useCustomFieldsSection({ customFields: contact?.customFields, onSelect });
	const agentSection = useAgentSection({ onSelect });

	return (
		<GenericMenu
			button={<PlaceholderButton {...props} />}
			title=''
			disabled={disabled}
			maxWidth='100%'
			sections={[...contactSection, ...customFieldsSection, ...agentSection]}
			placement='bottom-end'
		/>
	);
};

export default TemplatePlaceholderSelector;
