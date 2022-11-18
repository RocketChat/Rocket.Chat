import { Box, Skeleton } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo, useEffect, useState } from 'react';

import { useSurfaceType } from '../contexts/SurfaceContext';
import type { BlockProps } from '../utils/BlockProps';
import { Image } from './ImageBlock.styles';

const maxSize = 360;

const fetchImageState = (img: HTMLImageElement) => {
  if (!img.complete) {
    return {
      loading: true,
      width: maxSize,
      height: (maxSize * 9) / 21,
    };
  }

  const { naturalWidth, naturalHeight } = img;

  const scaleRatio =
    naturalWidth > naturalHeight
      ? Math.min(naturalWidth, maxSize) / naturalWidth
      : Math.min(naturalHeight, maxSize) / naturalHeight;

  return {
    loading: false,
    width: naturalWidth * scaleRatio,
    height: naturalHeight * scaleRatio,
  };
};

type ImageBlockProps = BlockProps<UiKit.ImageBlock>;

const ImageBlock = ({
  className,
  block,
  surfaceRenderer,
}: ImageBlockProps): ReactElement => {
  const surface = useSurfaceType();

  const alignment =
    surface === 'banner' || surface === 'message' ? 'flex-start' : 'center';

  const [{ loading, width, height }, setState] = useState(() => {
    const img = document.createElement('img');
    img.src = block.imageUrl;
    return fetchImageState(img);
  });

  useEffect(() => {
    const img = document.createElement('img');

    const handleLoad = () => {
      setState(fetchImageState(img));
    };

    img.addEventListener('load', handleLoad);
    img.src = block.imageUrl;

    if (img.complete) {
      img.removeEventListener('load', handleLoad);
      setState(fetchImageState(img));
    }

    return () => {
      img.removeEventListener('load', handleLoad);
    };
  }, [block.imageUrl]);

  return (
    <Box
      className={className}
      display='flex'
      flexDirection='column'
      flexWrap='nowrap'
      alignItems={alignment}
    >
      <Box overflow='hidden' width={width}>
        {block.title && (
          <Box fontScale='c1' color='hint' withTruncatedText marginBlockEnd={4}>
            {surfaceRenderer.renderTextObject(
              block.title,
              0,
              UiKit.BlockContext.NONE
            )}
          </Box>
        )}
        {loading ? (
          <Skeleton variant='rect' width={width} height={height} />
        ) : (
          <Image
            imageUrl={block.imageUrl}
            width={width}
            height={height}
            aria-label={block.altText}
          />
        )}
      </Box>
    </Box>
  );
};

export default memo(ImageBlock);
