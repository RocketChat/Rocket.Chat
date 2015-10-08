describe 'rocketchat:markdown Client + Server', ->
	'use strict'

	it 'should exist', ->
		obj = RocketChat.Markdown { html: 'test' }
		expect(obj).toBeDefined()

	it 'should highlight with bold when surrounded by *', ->
		output = RocketChat.Markdown { 'msg': '', 'html':'*abc123*' }
		expect(output.html).toEqual('<span class="copyonly">*</span><strong>abc123</strong><span class="copyonly">*</span>')
