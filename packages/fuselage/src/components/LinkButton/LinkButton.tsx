import type { ButtonHTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';

export type LinkButtonProps = ElementProps<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>;

/**
 * A button that reads as a link inside a sentence, for an inline action that does not navigate, such as resending an email.
 */
function LinkButton({ type = 'button', className, ...props }: LinkButtonProps) {
	return <button type={type} className={cx('rcx-link-button', className)} {...props} />;
}

export default LinkButton;
