Template.keyboardShortcuts.helpers
#Get all of the "Items" in the "Keyboard_Shortcuts" object in the translation file.
#This allows us to add more keyboard shortcuts in the future without modifying the template.

    shortcuts: ->
        idx = 0
        data = []
        loop
            shortcut = 
                "Description": TAPi18n.__("Keyboard_Shortcuts.Items." + idx + ".Description"),
                "Keys": TAPi18n.__("Keyboard_Shortcuts.Items." + idx + ".Keys")
            if shortcut.Keys is "Keyboard_Shortcuts.Items." + idx + ".Keys"
                break  # Tapi18n did not find this value, so there are no more shortcuts defined.
            data.push(shortcut)
            idx++
        return data