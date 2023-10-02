import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

import ActionsBlock from '../blocks/ActionsBlock';
import CalloutBlock from '../blocks/CalloutBlock';
import ContextBlock from '../blocks/ContextBlock';
import DividerBlock from '../blocks/DividerBlock';
import ImageBlock from '../blocks/ImageBlock';
import InputBlock from '../blocks/InputBlock';
import PreviewBlock from '../blocks/PreviewBlock';
import SectionBlock from '../blocks/SectionBlock';
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

export type FuselageSurfaceRendererProps = ConstructorParameters<
  typeof UiKit.SurfaceRenderer
>[0];

export class FuselageSurfaceRenderer extends UiKit.SurfaceRenderer<ReactElement> {
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
    textObject: UiKit.TextObject,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return null;
    }

    return <PlainTextElement key={index} textObject={textObject} />;
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
        <ActionsBlock
          key={index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
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
        <ContextBlock
          key={index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
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
        <DividerBlock
          key={index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
      );
    }

    return null;
  }

  image(
    block: UiKit.ImageBlock | UiKit.ImageElement,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <ImageBlock
          key={index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
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
        <InputBlock
          key={block.element.actionId || index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
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
        <SectionBlock
          key={index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
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
      <ButtonElement
        key={index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <DatePickerElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <StaticSelectElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <MultiStaticSelectElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <OverflowElement
        key={index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <PlainTextInputElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <LinearScaleElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <ToggleSwitchElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <RadioButtonElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
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
      <CheckboxElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
    );
  }

  callout(
    block: UiKit.CalloutBlock,
    context: UiKit.BlockContext,
    index: number
  ): ReactElement | null {
    if (context === UiKit.BlockContext.BLOCK) {
      return (
        <CalloutBlock
          key={index}
          block={block}
          context={context}
          index={index}
          surfaceRenderer={this}
        />
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
      <TimePickerElement
        key={block.actionId || index}
        block={block}
        context={context}
        index={index}
        surfaceRenderer={this}
      />
    );
  }
}
