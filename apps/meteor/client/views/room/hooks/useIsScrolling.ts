import { useState, useCallback, useRef } from 'react';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { withThrottling } from '/lib/utils/highOrderFunctions';

export const useIsScrolling = () => {
  const [isScrolling, setIsScrolling] = useSafely(useState<boolean>(false));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = withThrottling({ wait: 100 })(() => {

    setIsScrolling(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 4000);
  });

  const innerRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      node.removeEventListener('scroll', handleScroll);  
      node.addEventListener('scroll', handleScroll, { passive: true });
    }
  }, [handleScroll]);

  return {
    innerRef,
    isScrolling,
  };
};