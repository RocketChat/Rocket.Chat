RocketChat.models.RawImports = class extends RocketChat.models._Base
	constructor: (name) ->
		@name = name
		@_initModel "raw_#{name}_import"
