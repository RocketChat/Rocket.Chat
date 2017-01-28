/*(function($) {

 var getNext = function(item) {
 if(item.length === 0) return null;
 if(item.next().length > 0) return item.next();
 return getNext(item.parent());
 };

 var getPrev = function(item) {
 if(item.length === 0) return null;
 if(item.prev().length > 0) return item.prev();
 return getPrev(item.parent());
 };

 $.fn.nextAnywhere = function(selector) {
 var next = getNext(this);
 while(next && next.length > 0) {
 if(next.is(selector)) return next;
 var el = next.find(selector);
 if(el.length > 0) return el.first();
 next = getNext(next);
 }
 return null;
 };

 $.fn.prevAnywhere = function(selector) {
 var prev = getPrev(this);
 while(prev && prev.length > 0) {
 if(prev.is(selector)) return prev;
 var el = prev.find(selector);
 if(el.length > 0) return el.last();
 prev = getPrev(prev);
 }
 return null;
 };

 })(jQuery);
 */
