import type { IMessageSearchProvider } from '@rocket.chat/core-typings';
import { Field, Icon, TextInput } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, Ref } from 'react';
import React, { forwardRef } from 'react';

type MessageSearchInputProps = {
	provider: IMessageSearchProvider;
} & ComponentProps<typeof TextInput>;

const MessageSearchInput = forwardRef(function MessageSearchInput(
	{ provider, ...props }: MessageSearchInputProps,
	ref: Ref<HTMLInputElement>,
) {
	const t = useTranslation();

	return (
		<Field>
			<Field.Row>
				<TextInput
					ref={ref}
					addon={<Icon name='magnifier' size='x20' />}
					placeholder={t('Search_Messages')}
					aria-label={t('Search_Messages')}
					autoComplete='off'
					{...props}
				/>
			</Field.Row>
			{provider.description && <Field.Hint dangerouslySetInnerHTML={{ __html: t(provider.description as TranslationKey) }} />}
		</Field>
	);
});

export default MessageSearchInput;
