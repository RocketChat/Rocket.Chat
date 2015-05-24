@UserPop = (->

    self = {}
    self.pop = {}
    win = $(window)

    create = ->
        if not self.pop.length
            self.pop = $("<div/>").addClass("flex-pop")
            self.wrapper = $("<div/>").addClass("wrapper")
            self.pop.append self.wrapper
            self.container.append self.pop
            Blaze.render Template.userCard, self.wrapper.get(0)
        else
            self.wrapper.empty()
            Blaze.render Template.userCard, self.wrapper.get(0)
            return

    empty = ->
        self.wrapper.empty() if self.pop.length

    ###
     * Position the self.pop element afer the user line
     * @param {el} user element
     * @return {}
    ###
    position = (el) ->
        if self.pop.length
            last = getLastEl(el)
            self.pop.insertAfter last
            self.top = self.pop.position().top

    getLineLength = ->
        length = 0
        self.$els.each ->
            $item = $(@)
            if $item.position().left < 40 and length > 0
                return false;
            else
                length++
        length

    updateEls = ->
        self.$els = self.container.children(self.el.tagName);

    getCurrentLine = (el) ->
        updateEls()
        Math.ceil((self.$els.index(el) + 1) / getLineLength())

    getLastEl = (el) ->
        info = {}
        info.top = $(el).position().top
        self.$els.each ->
            $item = $(@)
            if $item.position().top > info.top
                return false
            info.current = $item
        return info.current if info.current and info.current.length

    animeIn = (callback) ->
        startInterval()
        getLineLength()
        self.opening = 1
        self.pop.addClass("opened")
        setTimeout ->
            self.opening = 0
            self.opened = 1
            callback() if callback
        , 400

    animeOut = (callback) ->
        stopInterval()
        self.opening = 1
        self.pop.removeClass("opened")
        unSelect()
        setTimeout ->
            self.opening = 0
            self.opened = 0
            self.pop.appendTo "body"
            callback() if callback
        , 400

    enter = ($el) ->
        selected $el
        position($el.get(0))
        Session.set 'userProfileActive', $el.find("a").data('userid')

    unSelect = ->
        self.$els.each ->
            $(@).removeClass("selected")

    selected = ($el) ->
        unSelect()
        $el.addClass("selected")

    startInterval = ->
        stopInterval()
        self.interval = setInterval ->
            if(!checkLine())
                close()
        , 250

    stopInterval = ->
        if self.interval
            clearInterval self.interval

    ###
     * Check if the selected user is in the same line as when the self.pop was opened.
     * Also checks if the self.pop is in the same position as it was when first opened.
     * @return {boolean}
    ###
    checkLine = ->
        if self.top != self.pop.position().top
            return false
        if self.currentLine != getCurrentLine self.el
            return false
        return true

    open = (el) ->
        $el = $(el)
        self.el = el
        self.container = $el.parent()
        self.$els = self.container.children(el.tagName);
        self.$el = $el
        self.currentLine = getCurrentLine el
        if $el.hasClass "selected"
            close()
            return
        create()
        if self.opened then close ->
            enter($el)
            setTimeout ->
                animeIn()
            , 10
        else
            enter($el)
            setTimeout ->
                animeIn()
            , 10

    resize = ->
        if self.opened
            close()

    init = ->
        $(window).unbind("resize.pop").bind "resize.pop", ->
            resize()

    close = (callback) ->
        if self.opened
            animeOut(callback)

    open: open
    close: close
    init: init
)()
