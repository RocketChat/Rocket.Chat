/* Creates a temporary table if such doesn't exists to store the
 * hashes of the previously computed result.
 * Returns the changed rows with extra columns 'hash' and 'delta_id'.
 * If the query fields are all set to null, the row was removed from the set.
 *
 * Arguments: query, queryName, deltaIdType (int or string are common)
 */
CREATE TEMP TABLE IF NOT EXISTS $$queryName$$_cache (id $$deltaIdType$$, _hash TEXT);
WITH
  res as ($$query$$),
  vals as (SELECT *, MD5(CAST(ROW_TO_JSON(res.*) AS TEXT)) AS hash FROM res),
  updated as (
    UPDATE $$queryName$$_cache
    SET _hash = vals.hash
    FROM vals
    WHERE _hash <> hash and $$queryName$$_cache.id = vals.id
    RETURNING vals.id
  ),
  inserted as (
    INSERT INTO $$queryName$$_cache(id, _hash)
    (
      SELECT id, hash
      FROM vals
      WHERE id NOT IN (SELECT id from $$queryName$$_cache)
    )
    RETURNING id
  ),
  deleted as (
    DELETE FROM $$queryName$$_cache
    WHERE id NOT IN (SELECT id from vals)
    RETURNING id
  )

SELECT deltas.id AS delta_id, vals.* FROM (
  SELECT * FROM updated UNION
  SELECT * FROM inserted UNION
  SELECT * FROM deleted
) AS deltas LEFT OUTER JOIN vals ON deltas.id = vals.id;
