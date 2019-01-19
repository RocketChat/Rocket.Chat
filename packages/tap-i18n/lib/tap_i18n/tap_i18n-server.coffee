_.extend TAPi18n.prototype,
  server_translators: null

  _registerServerTranslator: (lang_tag, package_name) ->
    if @_enabled()
      if not(lang_tag of @server_translators)
        @server_translators[lang_tag] = @_getSpecificLangTranslator(lang_tag)

      # fallback language is integrated, and isn't part of @translations 
      if lang_tag != @_fallback_language
        @addResourceBundle(lang_tag, package_name, @translations[lang_tag][package_name])

    if not(@_fallback_language of @server_translators)
      @server_translators[@_fallback_language] = @_getSpecificLangTranslator(@_fallback_language)

  _registerAllServerTranslators: () ->
    for lang_tag in @_getProjectLanguages()
      for package_name of @translations[lang_tag]
        @_registerServerTranslator(lang_tag, package_name)

  _getPackageI18nextProxy: (package_name) ->
    # A proxy to TAPi18next.t where the namespace is preset to the package's
    (key, options, lang_tag=null) =>
      if not lang_tag?
        # translate to fallback_language
        return @server_translators[@_fallback_language] "#{@_getPackageDomain(package_name)}:#{key}", options
      else if not(lang_tag of @server_translators)
        console.log "Warning: language #{lang_tag} is not supported in this project, fallback language (#{@_fallback_language})"
        return @server_translators[@_fallback_language] "#{@_getPackageDomain(package_name)}:#{key}", options
      else
        return @server_translators[lang_tag] "#{@_getPackageDomain(package_name)}:#{key}", options

  _registerHTTPMethod: ->
    self = @

    methods = {}

    if not self._enabled()
      throw new Meteor.Error 500, "tap-i18n has to be enabled in order to register the HTTP method"

    methods["#{self.conf.i18n_files_route.replace(/\/$/, "")}/multi/:langs"] =
      get: () ->
        if not RegExp("^((#{globals.langauges_tags_regex},)*#{globals.langauges_tags_regex}|all).json$").test(@params.langs)
          return @setStatusCode(401)

        langs = @params.langs.replace ".json", ""

        if langs == "all"
          output = self.translations
        else
          output = {}

          langs = langs.split(",")
          for lang_tag in langs
            if lang_tag in self._getProjectLanguages() and \
               lang_tag != self._fallback_language # fallback language is integrated to the bundle
              language_translations = self.translations[lang_tag]

              if language_translations?
                output[lang_tag] = language_translations

        return JSON.stringify(output)

    methods["#{self.conf.i18n_files_route.replace(/\/$/, "")}/:lang"] =
      get: () ->
        if not RegExp("^#{globals.langauges_tags_regex}.json$").test(@params.lang)
          return @setStatusCode(401)

        lang_tag = @params.lang.replace ".json", ""

        if lang_tag not in self._getProjectLanguages() or \
           lang_tag == self._fallback_language # fallback language is integrated to the bundle
          return @setStatusCode(404) # not found

        language_translations = self.translations[lang_tag]
        # returning {} if lang_tag is not in translations allows the project
        # developer to force a language supporte with project-tap.i18n's
        # supported_languages property, even if that language has no lang
        # files.
        return JSON.stringify(if language_translations? then language_translations else {})

    HTTP.methods methods

  _onceEnabled: ->
    @_registerAllServerTranslators()