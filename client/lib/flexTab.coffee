@FlexTab = (->
	check = ->
		$flex = $("section.flex-tab")
		if $flex.length
			$search = $flex.find ".search-form"
			if $search.length
				$siblings = $search.siblings("a")
				if $siblings.length
					width = ($siblings.outerWidth() + $siblings.css("marginLeft").replace("px","") * 2) * $siblings.length + 1
					$search.css
						width: "calc(100% - #{width}px)"
	check: check
)()
