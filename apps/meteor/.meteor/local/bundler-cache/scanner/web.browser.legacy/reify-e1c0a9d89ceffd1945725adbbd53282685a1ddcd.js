'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var subscribable = require('./subscribable.js');
var utils = require('./utils.js');

class OnlineManager extends subscribable.Subscribable {
  constructor() {
    super();

    this.setup = onOnline => {
      // addEventListener does not exist in React Native, but window does
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!utils.isServer && window.addEventListener) {
        const listener = () => onOnline(); // Listen to online


        window.addEventListener('online', listener, false);
        window.addEventListener('offline', listener, false);
        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('online', listener);
          window.removeEventListener('offline', listener);
        };
      }
    };
  }

  onSubscribe() {
    if (!this.cleanup) {
      this.setEventListener(this.setup);
    }
  }

  onUnsubscribe() {
    if (!this.hasListeners()) {
      var _this$cleanup;

      (_this$cleanup = this.cleanup) == null ? void 0 : _this$cleanup.call(this);
      this.cleanup = undefined;
    }
  }

  setEventListener(setup) {
    var _this$cleanup2;

    this.setup = setup;
    (_this$cleanup2 = this.cleanup) == null ? void 0 : _this$cleanup2.call(this);
    this.cleanup = setup(online => {
      if (typeof online === 'boolean') {
        this.setOnline(online);
      } else {
        this.onOnline();
      }
    });
  }

  setOnline(online) {
    this.online = online;

    if (online) {
      this.onOnline();
    }
  }

  onOnline() {
    this.listeners.forEach(listener => {
      listener();
    });
  }

  isOnline() {
    if (typeof this.online === 'boolean') {
      return this.online;
    }

    if (typeof navigator === 'undefined' || typeof navigator.onLine === 'undefined') {
      return true;
    }

    return navigator.onLine;
  }

}
const onlineManager = new OnlineManager();

exports.OnlineManager = OnlineManager;
exports.onlineManager = onlineManager;
//# sourceMappingURL=onlineManager.js.map
