import { Box } from '@rocket.chat/fuselage';
import { usePosition, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { forwardRef, useRef, useEffect, useState, useMemo } from 'react';

const hidden = {
	visibility: 'hidden',
	opacity: 0,
	position: 'fixed',
} as const;

const DropDownListWrapper = forwardRef<Element, ComponentProps<typeof Box> & { onClose: (e: MouseEvent) => void }>(
	function CategoryDropDownListWrapper({ children, onClose }, ref) {
		const target = useRef<HTMLElement>(null);
		const [isMobile, setIsMobile] = useState(() => 
			typeof window !== 'undefined' && window.innerWidth <= 768
		);
		
		useOutsideClick([target], onClose);
		
		// Update mobile state on window resize
		useEffect(() => {
			const handleResize = () => {
				setIsMobile(window.innerWidth <= 768);
			};
			
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}, []);
		
		// Dynamic placement based on screen size
		const options = useMemo(() => {
			return {
				margin: 8,
				placement: (isMobile ? 'bottom' : 'bottom-end') as const,
			};
		}, [isMobile]);
		
		const { style = hidden } = usePosition(ref as Parameters<typeof usePosition>[0], target, options);
		
		// Enhanced mobile styling to fix positioning issues
		const enhancedStyle = useMemo(() => {
			if (!isMobile || style === hidden) {
				return style;
			}
			
			return {
				...style,
				// Center dropdown on mobile with horizontal centering
				left: '50%',
				transform: 'translateX(-50%)',
				// Prevent dropdown from exceeding viewport
				maxHeight: 'calc(100vh - 120px)',
				overflowY: 'auto' as const,
				// Ensure safe margins from viewport edges
				margin: '8px',
				maxWidth: 'calc(100vw - 16px)',
			};
		}, [isMobile, style]);
		
		// Responsive sizing
		const minWidth = isMobile ? 'auto' : 224;
		const maxWidth = isMobile ? 'calc(100vw - 16px)' : 'none';
		
		return (
			<Box 
				ref={target} 
				style={enhancedStyle} 
				minWidth={minWidth} 
				maxWidth={maxWidth}
				zIndex='99999'
			>
				{children}
			</Box>
		);
	},
);

export default DropDownListWrapper;
