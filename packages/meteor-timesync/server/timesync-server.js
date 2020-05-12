import { WebApp } from 'meteor/webapp';
// Use rawConnectHandlers so we get a response as quickly as possible
// https://github.com/meteor/meteor/blob/devel/packages/webapp/webapp_server.js

var syncUrl = "/_timesync";
if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX) {
	syncUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + syncUrl;
}

WebApp.rawConnectHandlers.use(syncUrl,
  function(req, res, next) {
    // Never ever cache this, otherwise weird times are shown on reload
    // http://stackoverflow.com/q/18811286/586086
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", 0);

    // Avoid MIME type warnings in browsers
    res.setHeader("Content-Type", "text/plain");

    res.end(Date.now().toString());
  }
);
