import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const highLightStyle = () => {
  const style = HighlightStyle.define([
    { tag: t.literal, color: 'var(--RCPG-primary-color)' },
    { tag: t.bool, color: 'var(--RCPG-tertary-color)' },
    { tag: t.number, color: 'var(--RCPG-secondary-color)' },
  ]);

  return syntaxHighlighting(style);
};

export default highLightStyle();
