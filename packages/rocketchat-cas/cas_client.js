
Meteor.loginWithCas = function(callback) {

    var credentialToken = Random.id();
    var login_url = RocketChat.settings.get("CAS_login_url");
    var popup_width = RocketChat.settings.get("CAS_popup_width");
    var popup_height = RocketChat.settings.get("CAS_popup_height");

    if (!login_url) {
        return;
    }

    var loginUrl = login_url + "?service=" + Meteor.absoluteUrl('_cas/') + credentialToken;

    var popup = openCenteredPopup(
        loginUrl,
        popup_width || 800,
        popup_height || 600
    );

    var checkPopupOpen = setInterval(function() {
        try {
            // Fix for #328 - added a second test criteria (popup.closed === undefined)
            // to humour this Android quirk:
            // http://code.google.com/p/android/issues/detail?id=21061
            var popupClosed = popup.closed || popup.closed === undefined;
        } catch (e) {
            // For some unknown reason, IE9 (and others?) sometimes (when
            // the popup closes too quickly?) throws "SCRIPT16386: No such
            // interface supported" when trying to read 'popup.closed'. Try
            // again in 100ms.
            return;
        }

        if (popupClosed) {
            clearInterval(checkPopupOpen);

            // check auth on server.
            Accounts.callLoginMethod({
                methodArguments: [{ cas: { credentialToken: credentialToken } }],
                userCallback: callback
            });
        }
    }, 100);
};

var openCenteredPopup = function(url, width, height) {

    var screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
    var screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
    var outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
    var outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : (document.body.clientHeight - 22);
    // XXX what is the 22?

    // Use `outerWidth - width` and `outerHeight - height` for help in
    // positioning the popup centered relative to the current window
    var left = screenX + (outerWidth - width) / 2;
    var top = screenY + (outerHeight - height) / 2;
    var features = ('width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',scrollbars=yes');

    var newwindow = window.open(url, 'Login', features);
    if (newwindow.focus) {
        newwindow.focus();
    }

    return newwindow;
};
