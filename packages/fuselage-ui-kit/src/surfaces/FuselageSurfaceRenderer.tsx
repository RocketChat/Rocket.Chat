import * as UiKit from '@rocket.chat/ui-kit';
import { type ReactElement } from 'react';

import ActionsBlock from '../blocks/ActionsBlock';
import CalloutBlock from '../blocks/CalloutBlock';
import ContextBlock from '../blocks/ContextBlock';
import DividerBlock from '../blocks/DividerBlock';
import ImageBlock from '../blocks/ImageBlock';
import InputBlock from '../blocks/InputBlock';
import PreviewBlock from '../blocks/PreviewBlock';
import SectionBlock from '../blocks/SectionBlock';
import { AppIdProvider } from '../contexts/AppIdContext';
import ButtonElement from '../elements/ButtonElement';
import CheckboxElement from '../elements/CheckboxElement';
import DatePickerElement from '../elements/DatePickerElement';
import ImageElement from '../elements/ImageElement';
import LinearScaleElement from '../elements/LinearScaleElement';
import MarkdownTextElement from '../elements/MarkdownTextElement';
import MultiStaticSelectElement from '../elements/MultiStaticSelectElement';
import OverflowElement from '../elements/OverflowElement';
import PlainTextElement from '../elements/PlainTextElement';
import PlainTextInputElement from '../elements/PlainTextInputElement';
import RadioButtonElement from '../elements/RadioButtonElement';
import StaticSelectElement from '../elements/StaticSelectElement';
import TimePickerElement from '../elements/TimePickerElement';
import ToggleSwitchElement from '../elements/ToggleSwitchElement';

type TextObjectRenderers = {
  [TTextObject in UiKit.TextObject as TTextObject['type']]: (
    textObject: TTextObject,
    index: number
  ) => ReactElement | null;
};

const textObjectRenderers: TextObjectRenderers = {
  plain_text: (textObject, index) => (
    <PlainTextElement key={index} textObject={textObject} />
  ),
  mrkdwn: (textObject, index) => (
    <MarkdownTextElement key={index} textObject={textObject} />
  ),
};

export const renderTextObject = (
  textObject: UiKit.TextObject,
  context: UiKit.BlockContext,
  index: number
) => {
  if (context === UiKit.BlockContext.BLOCK) {
    return null;
  }

  switch (textObject.type) {
    case 'plain_text':
      return textObjectRenderers.plain_text(textObject, index);

    case 'mrkdwn':
      return textObjectRenderers.mrkdwn(textObject, index);
  }
};

const isImageBlock = (
  _elementOrBlock: UiKit.ImageBlock | UiKit.ImageElement,
  context: UiKit.BlockContext
): _elementOrBlock is UiKit.ImageBlock => {
  return context === UiKit.BlockContext.BLOCK;
};

type FuselageSurfaceRendererProps = ConstructorParameters<
  typeof UiKit.SurfaceRenderer
>[0];

export abstract class FuselageSurfaceRenderer extends UiKit.SurfaceRenderer<ReactElement> {
  public constructor(allowedBlocks?: FuselageSurfaceRendererProps) {
    super(
      allowedBlocks || [
        'actions',
        'context',
        'divider',
        'image',
        'input',
        'section',
        'preview',
      ]
    );
  }

  public plain_text(
    textObject: UiKit.PlainText,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return textObjectRenderers.plain_text(textObject, index);
  }

  public mrkdwn(
    textObject: UiKit.TextObject,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return <MarkdownTextElement key={index} textObject={textObject} />;
  }

  public text(
    textObject: UiKit.TextObject,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (textObject.type === 'mrkdwn') {
      return this.mrkdwn(textObject, context, index);
    }

    return this.plain_text(textObject, context, index);
  }

  actions(
    block: UiKit.ActionsBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <AppIdProvider key={index} appId={block.appId}>
          <ActionsBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return null;
  }

  preview(
    block: UiKit.PreviewBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context !== UiKit.BlockContext.BLOCK) {
      return null;
    }
    return (
      <PreviewBlock
        key={index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
    );
  }

  context(
    block: UiKit.ContextBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <AppIdProvider key={index} appId={block.appId}>
          <ContextBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return null;
  }

  divider(
    block: UiKit.DividerBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <AppIdProvider key={index} appId={block.appId}>
          <DividerBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return null;
  }

  image(
    block: UiKit.ImageBlock | UiKit.ImageElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (isImageBlock(block, context)) {
      return (
        <AppIdProvider key={index} appId={block.appId}>
          <ImageBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return (
      <ImageElement
        key={index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
    );
  }

  input(
    block: UiKit.InputBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <AppIdProvider
          key={block.element.actionId || index}
          appId={block.appId}
        >
          <InputBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return null;
  }

  section(
    block: UiKit.SectionBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <AppIdProvider key={index} appId={block.appId}>
          <SectionBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return null;
  }

  button(
    block: UiKit.ButtonElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={index} appId={block.appId}>
        <ButtonElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  datepicker(
    block: UiKit.DatePickerElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <DatePickerElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  static_select(
    block: UiKit.StaticSelectElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <StaticSelectElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  multi_static_select(
    block: UiKit.MultiStaticSelectElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <MultiStaticSelectElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  overflow(
    block: UiKit.OverflowElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={index} appId={block.appId}>
        <OverflowElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  plain_text_input(
    block: UiKit.PlainTextInputElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <PlainTextInputElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  linear_scale(
    block: UiKit.LinearScaleElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <LinearScaleElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  toggle_switch(
    block: UiKit.ToggleSwitchElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <ToggleSwitchElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  radio_button(
    block: UiKit.RadioButtonElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <RadioButtonElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  checkbox(
    block: UiKit.CheckboxElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <CheckboxElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }

  callout(
    block: UiKit.CalloutBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <AppIdProvider key={index} appId={block.appId}>
          <CalloutBlock
            block={block}
            context={context}
            index={index}
            surfaceRenderer={this}
          />
        </AppIdProvider>
      );
    }

    return null;
  }

  time_picker(
    block: UiKit.TimePickerElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return (
      <AppIdProvider key={block.actionId || index} appId={block.appId}>
        <TimePickerElement
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      </AppIdProvider>
    );
  }
}
