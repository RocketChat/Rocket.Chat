import { Box, Icon, TextInput, Margins } from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, ComponentPropsWithoutRef, FormEvent } from 'react';
import { forwardRef, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// TODO: consider changing the type of TextInput's `onChange` to (event: ChangeEvent<HTMLInputElement>) => void
type FilterByTextProps = Omit<ComponentPropsWithoutRef<typeof TextInput>, 'onChange'> & {
	shouldAutoFocus?: boolean;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

const FilterByText = forwardRef<HTMLInputElement, FilterByTextProps>(function FilterByText(
	{ placeholder, shouldAutoFocus = false, children, ...props },
	ref,
) {
	const { t } = useTranslation();
	const autoFocusRef = useAutoFocus(shouldAutoFocus);
	const mergedRefs = useMergedRefs(ref, autoFocusRef);

	const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
	}, []);

	return (
		<Box mb={16} mi='neg-x4' is='form' onSubmit={handleFormSubmit} display='flex' flexWrap='wrap' alignItems='center'>
			<Box mi={4} display='flex' flexGrow={1}>
				<TextInput
					{...props}
					placeholder={placeholder ?? t('Search')}
					ref={mergedRefs}
					addon={<Icon name='magnifier' size='x20' />}
					flexGrow={2}
					minWidth='x220'
					aria-label={placeholder ?? t('Search')}
				/>
			</Box>
			{children && <Margins inline={4}>{children}</Margins>}
		</Box>
	);
});

export default memo(FilterByText);
