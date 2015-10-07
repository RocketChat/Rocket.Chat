describe('Testing rocketchat:markdown', function () {
  'use strict';
 it('should highlight with bold when surrounded by *', function () {
 	var output = RocketChat.Markdown({'msg': '', 'html':'*abc123*'});
 	expect(output.html).toEqual('<span class="copyonly">*</span><strong>abc123</strong><span class="copyonly">*</span>')
 	});
 });