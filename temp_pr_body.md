## Summary
This PR fixes IP whitelist matching for failed-login protection.

Previously, values from `Block_Multiple_Failed_Logins_Ip_Whitelist` were split by comma but not trimmed before comparison. As a result, entries with spaces after commas could fail to match and valid whitelisted IPs could still be blocked.

This change trims each entry and removes empty values before checking whether the client IP is whitelisted.

## Changes
- split the whitelist string into entries
- trim leading and trailing whitespace from each entry
- filter out empty values

## Testing
- configured a whitelist with comma-separated IPs containing spaces
- verified trimmed entries are matched correctly
- verified empty comma-separated values are ignored safely
