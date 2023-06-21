import type { TextObject } from '@rocket.chat/ui-kit';
import { Fragment } from 'react';

const PlainTextElement = ({ textObject }: { textObject: TextObject }) => {
  return <Fragment>{textObject.text}</Fragment>;
};

export default PlainTextElement;
