/*
 * Template for refreshing a result set, only returning unknown rows
 * Accepts 2 arguments:
 * query: original query string
 * hashParam: count of params in original query + 1. This is used to
 * pass hashes as the last argument. Since the original $$query$$ can
 * expand to something that accepts arguments (contain $1, $2, etc),
 * it is important to expand this to $3 or whatever the last argument
 * index is.
 */
WITH
  query_result AS ($$query$$),
  result_with_hashes AS (
    SELECT
      query_result.*,
      MD5(CAST(ROW_TO_JSON(query_result.*) AS TEXT)) AS _hash
    FROM query_result
  ),

  new_and_changed AS (
    SELECT result_with_hashes.*
    FROM result_with_hashes
    WHERE NOT (_hash = ANY (
      /* NOTE the tripple dollar on the left */
      $$$hashParam$$))
  ),
  removed AS (
    SELECT *
    FROM (VALUES $$stringifiedHashesList$$) AS t(_hash)
    WHERE NOT (t._hash IN (SELECT _hash FROM result_with_hashes))
  )

SELECT NULL AS removed_hash, * FROM new_and_changed UNION ALL
SELECT removed._hash AS removed_hash, result_with_hashes.* FROM removed LEFT JOIN result_with_hashes ON removed._hash = result_with_hashes._hash
