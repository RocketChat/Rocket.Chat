import { modalParser } from '@rocket.chat/fuselage-ui-kit';
import React from 'react';

import ParsedText from '../../components/message/content/uikit/ParsedText';

// TODO: move this to fuselage-ui-kit itself
modalParser.plainText = ({ text } = {}) => text;

// TODO: move this to fuselage-ui-kit itself
modalParser.mrkdwn = ({ text }) => <ParsedText text={text} />;
