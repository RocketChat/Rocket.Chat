---
'@rocket.chat/meteor': major
---

feat: Improve file name search with unicode support
- Add unicode flag ('u') to file search regex patterns
- Enable proper search for files with non-ASCII characters in names
- Update file search across channels, direct messages, and groups
- Fix search functionality for international character sets
