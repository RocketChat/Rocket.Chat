export const WebApp = {
  _isCssLoaded() {
    if (document.styleSheets.length === 0) {
      return true;
    }

    return Array.prototype.find.call(document.styleSheets, sheet => {
      if (sheet.cssText && ! sheet.cssRules) { // IE8
        return ! sheet.cssText.match(/meteor-css-not-found-error/);
      }

      return ! Array.prototype.find.call(
        sheet.cssRules,
        rule => rule.selectorText === '.meteor-css-not-found-error'
      );
    });
  }
};
