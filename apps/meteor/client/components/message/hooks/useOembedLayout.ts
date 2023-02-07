import { useLayout, useSetting } from '@rocket.chat/ui-contexts';

type OembedLayout = {
	enabled: boolean;
	maxWidth: number | '100%';
	maxHeight: number;
};

/**
 * Returns the layout parameters for oembeds
 */
export const useOembedLayout = (): OembedLayout => {
	/*
  Note: both `useSetting` and `useLayout` are hooks that don't force a re-render
  very often, so this hook is not going to be re-evaluated very often either;
  this is why we don't need to memoize the result or store it in a context
  */
	const enabled = useSetting<boolean>('API_Embed', false);
	const { isMobile } = useLayout();

	const maxWidth = isMobile ? ('100%' as const) : 368;
	const maxHeight = 368;

	return { enabled, maxWidth, maxHeight };
};
