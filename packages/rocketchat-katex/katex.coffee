###
# KaTeX is a fast, easy-to-use JavaScript library for TeX math rendering on the web.
# https://github.com/Khan/KaTeX
###

class Katex
	delimiters_map: {
		'\\[': { closer: '\\]', displayMode: true  },
		'\\(': { closer: '\\)', displayMode: false },

		# Conflicts with message tokens syntax: $token$
		'$$' : { closer: '$$' , displayMode: true  },
		'$'  : { closer: '$'  , displayMode: false },
	}

	# Searches for the first opening delimiter in the string
	find_opening_delimiter: (str) ->
		# Search the string for each opening delimiter
		matches = ({options: o, pos: str.indexOf(b)} for b,o of @delimiters_map)
		positions = (b.pos for b in matches when b.pos >= 0)

		# No opening delimiters were found
		if positions.length == 0
			return null

		# Take the first delimiter found
		pos = Math.min.apply Math, positions

		match_index = (b.pos for b in matches).indexOf(pos)
		match = matches[match_index]

		return match

	class Boundary
		length: () ->
			return @end - @start

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
		unless str.length and (opening_delimiter_match = @find_opening_delimiter str)?
			return null
		
		match = @get_latex_boundaries str, opening_delimiter_match

		match?.options = opening_delimiter_match.options

		return match

	# Breaks a message to what comes before, after and to the content of a
	# matched latex block
	extract_latex: (str, match) ->
		before = str.substr 0, match.outer.start
		after  = str.substr match.outer.end

		latex = str.substr match.inner.start, match.inner.length()
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
			rendered += 	"#{e.message}"
			rendered += "</div>"
		
		return rendered

	# Takes a string and renders all latex blocks inside it
	render: (str) ->
		result = ''

		while true

			# Find the first latex block in the string
			match = @find_latex str
			unless match?
				result += str
				break

			parts = @extract_latex str, match

			# Add to the reuslt what comes before the latex block as well as
			# the rendered latex content
			rendered = @render_latex parts.latex, match.options.displayMode
			result += parts.before + rendered
			
			# Set what comes after the latex block to be examined next
			str = parts.after

		return result

	# Takes a rocketchat message and renders latex in its content
	render_message: (message) ->
		# Render only if enabled in admin panel
		if RocketChat.settings.get('Katex_Enabled')
			msg = message

			if not _.isString message
				if _.trim message.html
					msg = message.html
				else
					return message

			msg = @render msg

			if not _.isString message
				message.html = msg
			else
				message = msg

		return message

RocketChat.katex = new Katex

cb = RocketChat.katex.render_message.bind(RocketChat.katex)
RocketChat.callbacks.add 'renderMessage', cb

if Meteor.isClient
	Blaze.registerHelper 'RocketChatKatex', (text) ->
		return RocketChat.katex.render_message text
