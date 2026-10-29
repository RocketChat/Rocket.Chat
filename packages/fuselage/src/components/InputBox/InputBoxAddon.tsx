import { styled, View } from '@tamagui/web';

import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';

export type InputBoxAddonProps = ElementProps<HTMLSpanElement>;

// Declared where they render: zero-runtime only erases a `styled()` whose every use is in its own module
const InputBoxAddonFrame = styled(View, {
	render: 'span',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	flexGrow: 0,
	flexShrink: 0,
	flexBasis: 'auto',
	minWidth: 'auto',
	minHeight: 'auto',
	cursor: 'pointer',
});

/**
 * An addon for the input box.
 */
function InputBoxAddon({ ref, children, ...props }: InputBoxAddonProps) {
	return (
		<InputBoxAddonFrame render={<span {...props} ref={ref} />} className={cx('rcx-box rcx-box--full', 'rcx-input-box__addon')}>
			{children}
		</InputBoxAddonFrame>
	);
}

export default InputBoxAddon;
