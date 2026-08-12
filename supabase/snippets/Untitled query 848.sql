select
  schemaname,
  tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;