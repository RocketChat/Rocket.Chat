import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentSection } from './hooks/useAgentSection';
import { useContactSection } from './hooks/useContactSection';
import { useCustomFieldsSection } from './hooks/useCustomFieldsSection';

type PlaceholderSelectorProps = Pick<ComponentProps<typeof Button>, 'mis'> & {
	contact?: Serialized<ILivechatContact>;
	onSelect(value: string): void;
};

const TemplatePlaceholderSelector = ({ contact, onSelect, ...props }: PlaceholderSelectorProps) => {
	const { t } = useTranslation();
	const contactSection = useContactSection({ contact, onSelect });
	const customFieldsSection = useCustomFieldsSection({ customFields: contact?.customFields, onSelect });
	const agentSection = useAgentSection({ onSelect });

	return (
		<GenericMenu
			button={
				<Button {...props} icon={undefined}>
					{t('Placeholder')}
				</Button>
			}
			title=''
			disabled={false}
			maxWidth='100%'
			sections={[...contactSection, ...customFieldsSection, ...agentSection]}
			placement='bottom-end'
		/>
	);
};

export default TemplatePlaceholderSelector;
