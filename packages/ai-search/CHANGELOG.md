# @rocket.chat/ai-search

## 0.4.0-rc.0

### Minor Changes

- ([#42720](https://github.com/RocketChat/Rocket.Chat/pull/42720)) Shows why AI search failed instead of an empty result list: the top bar and the results page now tell users when AI search is unavailable or not configured, and tell admins whether the pipeline rejected the credentials, could not be found, or did not respond, with a link to AI center

- ([#42720](https://github.com/RocketChat/Rocket.Chat/pull/42720)) Adds Room, From, Before and After filters to the AI search to narrow down the search radius, available behind the AI search feature preview.

## 0.3.0

### Minor Changes

- ([#42102](https://github.com/RocketChat/Rocket.Chat/pull/42102)) Adds hybrid retrieval to AI Search. A single search balance setting decides how much semantic retrieval contributes relative to keyword search, so a workspace can find messages by meaning without losing exact matches on error codes, ticket ids or function names. An optional recency boost, disabled by default, promotes newer messages after relevance ranking.

## 0.3.0-rc.0

### Minor Changes

- ([#42102](https://github.com/RocketChat/Rocket.Chat/pull/42102)) Adds hybrid retrieval to AI Search. A single search balance setting decides how much semantic retrieval contributes relative to keyword search, so a workspace can find messages by meaning without losing exact matches on error codes, ticket ids or function names. An optional recency boost, disabled by default, promotes newer messages after relevance ranking.

## 0.2.0

### Minor Changes

- ([#40890](https://github.com/RocketChat/Rocket.Chat/pull/40890)) Adds AI Search with semantic message results, optional OpenAI-compatible answers, and AI Center configuration.

## 0.2.0-rc.0

### Minor Changes

- ([#40890](https://github.com/RocketChat/Rocket.Chat/pull/40890)) Adds AI Search with semantic message results, optional OpenAI-compatible answers, and AI Center configuration.
