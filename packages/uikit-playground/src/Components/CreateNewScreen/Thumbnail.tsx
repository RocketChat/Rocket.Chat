import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React, { useRef, useMemo } from 'react';

interface ThumbnailProps {
  of: ReactNode;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ of }) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const scale = useMemo(() => {
    const pw = parentRef.current?.parentElement?.offsetWidth || 0;
    const ph = parentRef.current?.parentElement?.offsetHeight || 0;

    const width = elementRef.current?.offsetWidth || 0;
    const height = elementRef.current?.offsetHeight || 0;

    const scale = Math.min(pw / width, ph / height);
    return scale;
  }, [elementRef.current?.offsetHeight, elementRef.current?.offsetWidth]);

  return (
    <Box overflow="hidden" ref={parentRef}>
      <Box
        className={css`
          transform: scale(${scale});
          transform-origin: top;
          pointer-events: none;
        `}
        ref={elementRef}
      >
        {of}
      </Box>
    </Box>
  );
};

export default Thumbnail;
