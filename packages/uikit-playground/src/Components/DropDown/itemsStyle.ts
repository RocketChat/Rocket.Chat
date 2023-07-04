import { css } from '@rocket.chat/css-in-js';

export const itemStyle = (layer: number, hover: boolean) => {
  const style = css`
    cursor: pointer;
    padding-left: ${10 + (layer - 1) * 16}px;
    background-color: ${hover ? 'var(--RCPG-primary-color)' : 'transparent'};
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
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.3px;
        color: ${hover ? '#fff' : '#999'};
        text-transform: uppercase;
      `;
      break;
    case 2:
      customStyle = css`
        letter-spacing: 0.1px;
        font-size: 12px;
        color: ${hover ? '#fff' : '#555'};
        text-transform: capitalize;
      `;
      break;
    default:
      customStyle = css`
        font-size: 12px;
        color: ${hover ? '#fff' : '#555'};
        text-transform: capitalize;
      `;
      break;
  }
  return [customStyle, basicStyle];
};
