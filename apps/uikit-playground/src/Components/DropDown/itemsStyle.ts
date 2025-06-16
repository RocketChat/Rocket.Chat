import { css } from '@rocket.chat/css-in-js';

export const itemStyle = (layer: number, hover: boolean) => {
  const style = css`
    cursor: pointer !important;
    padding-left: ${10 + (layer - 1) * 16}px !important;
    background-color: ${hover
      ? 'var(--RCPG-primary-color) !important'
      : 'transparent !important'};
  `;
  return style;
};

export const labelStyle = (layer: number, hover: boolean) => {
  let customStyle;
  const basicStyle = css`
    cursor: pointer !important;
    padding-left: 4px !important;
  `;
  switch (layer) {
    case 1:
      customStyle = css`
        font-weight: 700 !important;
        font-size: 14px !important;
        letter-spacing: 0.3px !important;
        color: ${hover ? '#fff !important' : '#999 !important'};
        text-transform: uppercase !important;
      `;
      break;
    case 2:
      customStyle = css`
        letter-spacing: 0.1px !important;
        font-size: 12px !important;
        color: ${hover ? '#fff !important' : '#555 !important'};
        text-transform: capitalize !important;
      `;
      break;
    default:
      customStyle = css`
        font-size: 12px !important;
        color: ${hover ? '#fff !important' : '#555 !important'};
        text-transform: capitalize !important;
      `;
      break;
  }
  return [customStyle, basicStyle];
};
