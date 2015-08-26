/*
 * Template for trigger function to send row changes over notification
 * Accepts 2 arguments:
 * triggerFunction: name of function to create/replace
 * channel: NOTIFY channel on which to broadcast changes
 */
CREATE OR REPLACE FUNCTION "$$triggerFunction$$"() RETURNS trigger AS $$
  DECLARE
    row_data   RECORD;
    full_msg   TEXT;
    full_len   INT;
    cur_page   INT;
    page_count INT;
    msg_hash   TEXT;
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      SELECT
        TG_TABLE_NAME AS table,
        TG_OP         AS op,
        json_agg(NEW) AS data
      INTO row_data;
    ELSIF (TG_OP  = 'DELETE') THEN
      SELECT
        TG_TABLE_NAME AS table,
        TG_OP         AS op,
        json_agg(OLD) AS data
      INTO row_data;
    ELSIF (TG_OP = 'UPDATE') THEN
      SELECT
        TG_TABLE_NAME AS table,
        TG_OP         AS op,
        json_agg(NEW) AS new_data,
        json_agg(OLD) AS old_data
      INTO row_data;
    END IF;

    SELECT row_to_json(row_data)::TEXT INTO full_msg;
    SELECT char_length(full_msg)       INTO full_len;
    SELECT (full_len / 7950) + 1       INTO page_count;
    SELECT md5(full_msg)               INTO msg_hash;

    FOR cur_page IN 1..page_count LOOP
      PERFORM pg_notify('$$channel$$',
        msg_hash || ':' || page_count || ':' || cur_page || ':' ||
        substr(full_msg, ((cur_page - 1) * 7950) + 1, 7950)
      );
    END LOOP;
    RETURN NULL;
  END;
$$ LANGUAGE plpgsql;
