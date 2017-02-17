###
# KaTeX is a fast, easy-to-use JavaScript library for TeX math rendering on the web.
# https://github.com/Khan/KaTeX
###

katex = require('katex')

class Katex
	constructor: ->
		@delimiters_map = [
			{ opener: '\\[', closer: '\\]', displayMode: true , enabled: () => @parenthesis_syntax_enabled() },
			{ opener: '\\(', closer: '\\)', displayMode: false, enabled: () => @parenthesis_syntax_enabled() },
			{ opener: '$$' , closer: '$$' , displayMode: true , enabled: () => @dollar_syntax_enabled() },
			{ opener: '$'  , closer: '$'  , displayMode: false, enabled: () => @dollar_syntax_enabled() },
		]

	# Searches for the first opening delimiter in the string from a given position
	find_opening_delimiter: (str, start) -> # Search the string for each opening delimiter
		matches = ({options: o, pos: str.indexOf(o.opener, start)} for o in @delimiters_map when o.enabled())
		positions = (m.pos for m in matches when m.pos >= 0)

		# No opening delimiters were found
		if positions.length == 0
			return null

		# Take the first delimiter found
		pos = Math.min.apply Math, positions

		match_index = (m.pos for m in matches).indexOf(pos)
		match = matches[match_index]

		return match

	class Boundary
		length: ->
			return @end - @start

		extract: (str) ->
			return str.substr @start, @length()

	# Returns the outer and inner boundaries of the latex block starting
	# at the given opening delimiter
	get_latex_boundaries: (str, opening_delimiter_match) ->
		inner = new Boundary
		outer = new Boundary

		# The closing delimiter matching to the opening one
		closer = opening_delimiter_match.options.closer

		outer.start = opening_delimiter_match.pos
		inner.start = opening_delimiter_match.pos + closer.length

		# Search for a closer delimiter after the opening one
		closer_index = str.substr(inner.start).indexOf(closer)
		if closer_index < 0
			return null

		inner.end = inner.start + closer_index
		outer.end = inner.end + closer.length

		return {
			outer: outer
			inner: inner
		}

	# Searches for the first latex block in the given string
	find_latex: (str) ->
		start = 0
		while (opening_delimiter_match = @find_opening_delimiter str, start++)?

			match = @get_latex_boundaries str, opening_delimiter_match

			if match?.inner.extract(str).trim().length
				match.options = opening_delimiter_match.options
				return match

		return null

	# Breaks a message to what comes before, after and to the content of a
	# matched latex block
	extract_latex: (str, match) ->
		before = str.substr 0, match.outer.start
		after  = str.substr match.outer.end

		latex = match.inner.extract str
		latex = s.unescapeHTML latex

		return { before: before, latex : latex, after : after }

	# Takes a latex math string and the desired display mode and renders it
	# to HTML using the KaTeX library
	render_latex: (latex, displayMode) ->
		try
			rendered = katex.renderToString latex , {displayMode: displayMode}
		catch e
			display_mode = if displayMode then "block" else "inline"
			rendered =  "<div class=\"katex-error katex-#{display_mode}-error\">"
			rendered += 	"#{s.escapeHTML e.message}"
			rendered += "</div>"

		return rendered

	# Takes a string and renders all latex blocks inside it
	render: (str, render_func) ->
		result = ''

		loop

			# Find the first latex block in the string
			match = @find_latex str

			unless match?
				result += str
				break

			parts = @extract_latex str, match

			# Add to the reuslt what comes before the latex block as well as
			# the rendered latex content
			rendered = render_func parts.latex, match.options.displayMode
			result += parts.before + rendered

			# Set what comes after the latex block to be examined next
			str = parts.after

		return result

	# Takes a rocketchat message and renders latex in its content
	render_message: (message) ->
		# Render only if enabled in admin panel
		if @katex_enabled()
			msg = message

			if not _.isString message
				if _.trim message.html
					msg = message.html
				else
					return message

			if _.isString message
				render_func = (latex, displayMode) =>
					return @render_latex latex, displayMode
			else
				message.tokens ?= []

				render_func = (latex, displayMode) =>
					token = "=&=#{Random.id()}=&="

					message.tokens.push
						token: token
						text: @render_latex latex, displayMode

					return token

			msg = @render msg, render_func

			if not _.isString message
				message.html = msg
			else
				message = msg

		return message

	katex_enabled: ->
		return RocketChat.settings.get('Katex_Enabled')

	dollar_syntax_enabled: ->
		return RocketChat.settings.get('Katex_Dollar_Syntax')

	parenthesis_syntax_enabled: ->
		return RocketChat.settings.get('Katex_Parenthesis_Syntax')


RocketChat.katex = new Katex

cb = RocketChat.katex.render_message.bind(RocketChat.katex)
RocketChat.callbacks.add 'renderMessage', cb, RocketChat.callbacks.priority.HIGH - 1, 'katex'

if Meteor.isClient
	Blaze.registerHelper 'RocketChatKatex', (text) ->
		return RocketChat.katex.render_message text
