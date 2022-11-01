import {
  MessageGenericPreview,
  MessageGenericPreviewContent,
  MessageGenericPreviewDescription,
  MessageGenericPreviewCoverImage,
  MessageGenericPreviewTitle,
  MessageGenericPreviewFooter,
  MessageGenericPreviewThumb,
  Box,
} from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import {
  isPreviewBlockWithThumb,
  isPreviewBlockWithPreview,
} from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';
import ContextBlock from './ContextBlock';

type PreviewBlockProps = BlockProps<UiKit.PreviewBlock>;

const PreviewBlock = ({
  block,
  surfaceRenderer,
}: PreviewBlockProps): ReactElement => (
  <Box>
    <MessageGenericPreview>
      {isPreviewBlockWithPreview(block) && block.preview?.dimensions && (
        <MessageGenericPreviewCoverImage
          width={block.preview.dimensions.width}
          height={block.preview.dimensions.height}
          url={block.preview.url}
        />
      )}
      <MessageGenericPreviewContent
        thumb={
          isPreviewBlockWithThumb(block) ? (
            <MessageGenericPreviewThumb>
              <MessageGenericPreviewCoverImage
                height={192}
                width={368}
                url={block.thumb.url}
              />
            </MessageGenericPreviewThumb>
          ) : undefined
        }
      >
        {Array.isArray(block.title) ? (
          <MessageGenericPreviewTitle
            externalUrl={
              isPreviewBlockWithPreview(block) ? block.externalUrl : undefined
            }
          >
            {block.title.map((title) =>
              surfaceRenderer.renderTextObject(
                title,
                0,
                UiKit.BlockContext.NONE
              )
            )}
          </MessageGenericPreviewTitle>
        ) : null}
        {Array.isArray(block.description) ? (
          <MessageGenericPreviewDescription clamp>
            {block.description.map((description) =>
              surfaceRenderer.renderTextObject(
                description,
                0,
                UiKit.BlockContext.NONE
              )
            )}
          </MessageGenericPreviewDescription>
        ) : null}
        {block.footer && (
          <MessageGenericPreviewFooter>
            <ContextBlock
              block={block.footer}
              surfaceRenderer={surfaceRenderer}
              context={UiKit.BlockContext.BLOCK}
              index={0}
            />
          </MessageGenericPreviewFooter>
        )}
      </MessageGenericPreviewContent>
    </MessageGenericPreview>
  </Box>
);

export default memo(PreviewBlock);
