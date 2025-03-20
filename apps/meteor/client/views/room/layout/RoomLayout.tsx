/* eslint-disable no-nested-ternary */
import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import breakpointsDefinitions from '@rocket.chat/fuselage-tokens/breakpoints.json';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { LayoutContext, useLayout } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { Suspense, useMemo } from 'react';

import { ContextualbarDialog } from '../../../components/Contextualbar';
import HeaderSkeleton from '../Header/HeaderSkeleton';
import HeaderSkeletonV2 from '../HeaderV2/HeaderSkeleton';

type RoomLayoutProps = {
	header?: ReactNode;
	body?: ReactNode;
	footer?: ReactNode;
	aside?: ReactNode;
} & ComponentProps<typeof Box>;

const useBreakpointsElement = () => {
	const { ref, borderBoxSize } = useResizeObserver<HTMLElement>({
		debounceDelay: 30,
	});

	const breakpoints = useMemo(
		() =>
			breakpointsDefinitions
				.filter(({ minViewportWidth }) => minViewportWidth && borderBoxSize.inlineSize && borderBoxSize.inlineSize >= minViewportWidth)
				.map(({ name }) => name),
		[borderBoxSize],
	);

	return {
		ref,
		breakpoints,
	};
};

const RoomLayout = ({ header, body, footer, aside, ...props }: RoomLayoutProps): ReactElement => {
	const { ref, breakpoints } = useBreakpointsElement();

	const contextualbarPosition = breakpoints.includes('md') ? 'relative' : 'absolute';
	const contextualbarSize = breakpoints.includes('sm') ? (breakpoints.includes('xl') ? '38%' : '380px') : '100%';

	const layout = useLayout();

	return (
		<LayoutContext.Provider
			value={useMemo(
				() => ({
					...layout,
					contextualBarPosition: contextualbarPosition,
					size: {
						...layout.size,
						contextualBar: contextualbarSize,
					},
				}),
				[layout, contextualbarPosition, contextualbarSize],
			)}
		>
			<Box h='full' w='full' display='flex' flexDirection='column' bg='room' {...props} ref={ref}>
				<Suspense
					fallback={
						<FeaturePreview feature='newNavigation'>
							<FeaturePreviewOff>
								<HeaderSkeleton />
							</FeaturePreviewOff>
							<FeaturePreviewOn>
								<HeaderSkeletonV2 />
							</FeaturePreviewOn>
						</FeaturePreview>
					}
				>
					{header}
				</Suspense>
				<Box display='flex' flexGrow={1} overflow='hidden' height='full' position='relative'>
					<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0}>
						<Box is='div' display='flex' flexDirection='column' flexGrow={1}>
							<Suspense fallback={null}>{body}</Suspense>
						</Box>
						{footer && <Suspense fallback={null}>{footer}</Suspense>}
					</Box>
					{aside && (
						<ContextualbarDialog position={contextualbarPosition}>
							<Suspense fallback={null}>{aside}</Suspense>
						</ContextualbarDialog>
					)}
				</Box>
			</Box>
		</LayoutContext.Provider>
	);
};

export default RoomLayout;
