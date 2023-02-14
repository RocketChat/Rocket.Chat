/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */
import { modalParser } from '@rocket.chat/fuselage-ui-kit';
import React from 'react';

import { renderMessageBody } from '../../lib/utils/renderMessageBody';

// TODO: move this to fuselage-ui-kit itself
modalParser.plainText = ({ text } = {}) => text;

// TODO: move this to fuselage-ui-kit itself
modalParser.mrkdwn = ({ text }) => <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
