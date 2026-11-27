import type { ReactNode } from 'react';

export type WrappingOptionLabelProps = {
	children: ReactNode;
};

/**
 * An option label that wraps onto more lines instead of truncating, for long department names.
 */
const WrappingOptionLabel = ({ children }: WrappingOptionLabelProps) => <span style={{ whiteSpace: 'normal' }}>{children}</span>;

export default WrappingOptionLabel;
