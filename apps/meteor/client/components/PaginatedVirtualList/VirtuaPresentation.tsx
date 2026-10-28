import type { CustomContainerComponentProps, CustomItemComponentProps } from 'virtua';

/**
 * A virtua container or item wrapper kept out of the accessibility tree, so the rows it holds stay direct items of the list.
 */
export const VirtuaPresentation = ({
	index: _index,
	...props
}: CustomContainerComponentProps & Partial<Pick<CustomItemComponentProps, 'index'>>) => <div role='none' {...props} />;
