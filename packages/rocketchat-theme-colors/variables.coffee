@variables = new class
	data: {}

	addColor: (name, value) ->
		@data[name] =
			value: value
			type: "color"

	getAsObject: ->
		obj = {}
		for name, item of @data
			obj[name] = item.value

		return obj

	getAsLess: ->
		items = []
		for name, item of @data
			items.push "@#{name}: #{item.value};"

		return items.join '\n'


variables.addColor "content-background-color", "#FFF"
variables.addColor "primary-background-color", "#04436A"
variables.addColor "secondary-background-color", "#F4F4F4"
variables.addColor "tertiary-background-color", "#EAEAEA"
variables.addColor "primary-font-color", "#444444"
variables.addColor "secondary-font-color", "#7F7F7F"
variables.addColor "tertiary-font-color", "rgba(255, 255, 255, 0.6)"
variables.addColor "input-font-color", "rgba(255, 255, 255, 0.85)"
variables.addColor "link-font-color", "#008CE3"
variables.addColor "info-font-color", "#AAAAAA"
variables.addColor "info-active-font-color", "#FF0000"
variables.addColor "smallprint-font-color", "#C2E7FF"
variables.addColor "smallprint-hover-color", "white"
variables.addColor "status-online", "#35AC19"
variables.addColor "status-offline", "rgba(150, 150, 150, 0.50)"
variables.addColor "status-busy", "#D30230"
variables.addColor "status-away", "#FCB316"
variables.addColor "code-background", "#F8F8F8"
variables.addColor "code-border", "#CCC"
variables.addColor "code-color", "#333"
variables.addColor "blockquote-background", "#CCC"
