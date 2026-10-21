import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import { ItemParentContext, skipRegistration, useItemContext } from './ItemContext';
import { toRender } from './itemStyles';
import { cx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const ItemContentFrame = styled(Text, {
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 'auto',
	minWidth: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
});

export type ItemContentProps = {
	is?: ElementType;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The flexible, truncating column that holds the title and description, or one `ItemRow` per line.
 */
const ItemContent = ({ is: Tag = 'div', className, ref, ...props }: ItemContentProps) => {
	const id = useId();
	const { registerMultiline } = useItemContext();
	const ownRef = useRef<HTMLElement>(null);
	const mergedRef = useMergedRefs(ownRef, ref);
	const [multiline, setMultiline] = useState(false);

	// Counts rendered elements, not React children, so a part that renders nothing is no line. A row that declares
	// `multiline` doesn't ask, which spares the render a measured second line causes on mount
	const measuresLines = registerMultiline !== skipRegistration;
	useLayoutEffect(() => {
		if (measuresLines) {
			setMultiline((ownRef.current?.children.length ?? 0) > 1);
		}
	});

	useLayoutEffect(() => (multiline ? registerMultiline(id) : undefined), [id, multiline, registerMultiline]);

	return (
		<ItemParentContext.Provider value={undefined}>
			<ItemContentFrame
				{...(props as GetProps<typeof ItemContentFrame>)}
				{...({ ref: mergedRef } as GetProps<typeof ItemContentFrame>)}
				render={toRender(Tag)}
				className={cx('rcx-item__content', className)}
			/>
		</ItemParentContext.Provider>
	);
};

export default withFuselageProvider(ItemContent);
