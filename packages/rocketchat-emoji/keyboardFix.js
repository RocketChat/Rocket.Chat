if (Meteor.isCordova) {
  window.addEventListener('native.keyboardshow', function() {
    if ((typeof device !== "undefined" && device !== null ? device.platform.toLowerCase() : void 0) !== 'android') {
      RocketChat.EmojiPicker.setPosition();
    }
  });
  window.addEventListener('native.keyboardhide', function() {
    if ((typeof device !== "undefined" && device !== null ? device.platform.toLowerCase() : void 0) !== 'android') {
      RocketChat.EmojiPicker.setPosition();
    }
  });
}