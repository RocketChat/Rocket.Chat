import { patchOmniLib } from '@rocket.chat/omni-lib-ee';

import './closeBusinessHour';
import './getInstanceList';
import './verifyContactChannel';
import './mergeContacts';
import './isAgentAvailableToTakeContactInquiry';
import './airGappedRestrictionsWrapper';

patchOmniLib();
