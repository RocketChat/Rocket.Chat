import { Grid } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import React from 'react';

const breakpoints = {
  xs: 4,
  sm: 4,
  md: 4,
  lg: 6,
  xl: 6,
} as const;

type FieldsProps = {
  fields: readonly UiKit.TextObject[];
  surfaceRenderer: UiKit.SurfaceRenderer<ReactElement>;
};

const Fields = ({ fields, surfaceRenderer }: FieldsProps): ReactElement => (
  <Grid>
    {fields.map((field, i) => (
      <Grid.Item {...breakpoints} key={i}>
        {surfaceRenderer.renderTextObject(field, 0, UiKit.BlockContext.NONE)}
      </Grid.Item>
    ))}
  </Grid>
);

export default Fields;
