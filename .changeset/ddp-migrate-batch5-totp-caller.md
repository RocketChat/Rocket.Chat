# Configuration
version: 1.0
app: devpilot

# Hyperlinks
version: 1.0
app: devpilot
rules:
  - match: "^(.*)\[(.*?)\]\((.*?)\)$"
    replace: "<a href=\"\3\">\1</a> <a href=\"\3\">[\2]</a>"
  - match: "^(.*)\[(.*?)\]\[(.*?)\]$"
    replace: "<a href=\"\3\">[\2]</a> \1"