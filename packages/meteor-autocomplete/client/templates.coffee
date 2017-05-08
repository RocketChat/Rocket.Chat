# Events on template instances, sent to the autocomplete class
acEvents =
  "keydown": (e, t) -> t.ac.onKeyDown(e)
  "keyup": (e, t) -> t.ac.onKeyUp(e)
  "focus": (e, t) -> t.ac.onFocus(e)
  "blur": (e, t) -> t.ac.onBlur(e)

Template.inputAutocomplete.events(acEvents)
Template.textareaAutocomplete.events(acEvents)

attributes = -> _.omit(@, 'settings') # Render all but the settings parameter

autocompleteHelpers = {
  attributes,
  autocompleteContainer: new Template('AutocompleteContainer', ->
    ac = new AutoComplete( Blaze.getData().settings )
    # Set the autocomplete object on the parent template instance
    this.parentView.templateInstance().ac = ac

    # Set nodes on render in the autocomplete class
    this.onViewReady ->
      ac.element = this.parentView.firstNode()
      ac.$element = $(ac.element)

    return Blaze.With(ac, -> Template._autocompleteContainer)
  )
}

Template.inputAutocomplete.helpers(autocompleteHelpers)
Template.textareaAutocomplete.helpers(autocompleteHelpers)

Template._autocompleteContainer.rendered = ->
  @data.tmplInst = this

Template._autocompleteContainer.destroyed = ->
  # Meteor._debug "autocomplete destroyed"
  @data.teardown()

###
  List rendering helpers
###

Template._autocompleteContainer.events
  # t.data is the AutoComplete instance; `this` is the data item
  "click .-autocomplete-item": (e, t) -> t.data.onItemClick(this, e)
  "mouseenter .-autocomplete-item": (e, t) -> t.data.onItemHover(this, e)

Template._autocompleteContainer.helpers
  empty: -> @filteredList().count() is 0
  noMatchTemplate: -> @matchedRule().noMatchTemplate || Template._noMatch
