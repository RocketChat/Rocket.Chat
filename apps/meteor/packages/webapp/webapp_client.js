export const WebApp = {
  _isCssLoaded: function() {
    if (document.styleSheets.length === 0) {
      return true;
    }

    return _.every(document.styleSheets, function(sheet) {
      if (sheet.cssRules) {
        return true;
      }

      if (sheet.rules) {
        return true;
      }

      return false;
    });
  },
};
