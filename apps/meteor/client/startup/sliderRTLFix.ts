import { Meteor } from 'meteor/meteor';

import { injectSliderRTLFix } from '../lib/utils/injectSliderRTLFix';

Meteor.startup(() => {
    injectSliderRTLFix();
});
