---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Improves the generated OpenAPI document: path parameters are now templated and described, query parameters are documented one by one instead of as a single opaque object, responses always carry a description, and endpoints can declare a summary, a description, examples and a deprecation notice
