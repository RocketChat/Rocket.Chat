import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';

const gaEndpoint = 'https://www.google-analytics.com/collect?';

let googleId = '';

Meteor.startup(() => {
    googleId = settings.get('GoogleAnalytics_enabled') && settings.get('GoogleAnalytics_ID');
});

// Send Google Analytics
function trackEvent(category, action, label, uid) {
    if (googleId) {
        HTTP.call('POST', gaEndpoint,
            { params: {
                v: '1',
                tid: googleId,
                uid: uid,
                t: 'event',
                ec: category,
                ea: action,
                el: label,
            } }
        );
    }
}

callbacks.add('customOauthRegisterNewUser', (uid) => {
    trackEvent('User', 'Registered', 'CustomOauth', uid);
}, callbacks.priority.MEDIUM, 'analytics-login-state-change');
