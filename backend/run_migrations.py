import os
import sys
import django

def safe_migrate():
    """
    Safely executes Django migrations during deployment.
    - Honors DROP_TABLES environment variable to drop specified comma-separated tables.
    - First tries standard migration with --fake-initial.
    - If a migration fails because of existing relations (e.g. relation "api_customer" already exists)
      or schema mismatches:
        * If 0001_initial failed because only a subset of initial models (like api_customer) exist
          as orphaned tables from an aborted deployment, it drops those orphaned tables so
          0001_initial can cleanly run and construct all application models.
        * If the database represents a complete pre-existing database schema, it detects existing
          tables and marks migration history in topological dependency order.
    """
    from django.core.management import call_command
    from django.db import connection, DatabaseError
    from django.db.migrations.recorder import MigrationRecorder
    from django.db.migrations.loader import MigrationLoader

    print("--- Running Database Migrations ---")

    # Step 0: Check if any tables are explicitly requested to be dropped via DROP_TABLES
    drop_tables_env = os.environ.get('DROP_TABLES', '').strip()
    if drop_tables_env:
        tables_to_drop = [t.strip() for t in drop_tables_env.split(',') if t.strip()]
        existing_tables = set(connection.introspection.table_names())
        with connection.cursor() as cursor:
            for table_name in tables_to_drop:
                # Sanitize table name to avoid SQL injection
                clean_table = ''.join(c for c in table_name if c.isalnum() or c == '_')
                if clean_table and clean_table in existing_tables:
                    print(f"Explicitly dropping table requested by DROP_TABLES: {clean_table}")
                    if connection.vendor == 'postgresql':
                        cursor.execute(f'DROP TABLE IF EXISTS "{clean_table}" CASCADE;')
                    else:
                        cursor.execute(f'DROP TABLE IF EXISTS "{clean_table}";')

    # Step 1: Attempt standard migration with --fake-initial
    try:
        call_command('migrate', '--fake-initial', interactive=False)
        print("Migrations applied successfully with --fake-initial.")
        return True
    except (DatabaseError, Exception) as exc:
        print(f"Initial migrate attempt raised {type(exc).__name__}: {exc}")
        print("Analyzing database schema to recover...")

    # Step 2: Introspect database tables and applied migrations
    try:
        recorder = MigrationRecorder(connection)
        recorder.ensure_schema()
        applied = set(recorder.applied_migrations())
        loader = MigrationLoader(connection, ignore_no_migrations=True)
        existing_tables = set(connection.introspection.table_names())

        print(f"Existing database tables detected: {len(existing_tables)}")
        print(f"Recorded migrations applied count: {len(applied)}")

        # Models defined in api.0001_initial
        initial_api_tables = {
            'api_customer',
            'api_drug',
            'api_staff',
            'api_prescription',
            'api_prescriptionitem',
            'api_sale',
        }
        initial_is_applied = ('api', '0001_initial') in applied
        initial_tables_in_db = initial_api_tables.intersection(existing_tables)

        # Case A: 0001_initial is NOT recorded as applied, but some initial tables (e.g. api_customer) exist.
        # This occurs when a previous deployment crashed mid-migration or created partial tables.
        # If not all initial tables exist, fake-initial cannot work, and migrate fails with "already exists".
        if not initial_is_applied and initial_tables_in_db:
            if initial_tables_in_db != initial_api_tables:
                print(
                    f"Partial/orphaned initial tables detected without recorded 0001_initial: {initial_tables_in_db}. "
                    "Cleaning orphaned initial tables so 0001_initial can run completely..."
                )
                with connection.cursor() as cursor:
                    for orphan in initial_tables_in_db:
                        if connection.vendor == 'postgresql':
                            cursor.execute(f'DROP TABLE IF EXISTS "{orphan}" CASCADE;')
                        else:
                            cursor.execute(f'DROP TABLE IF EXISTS "{orphan}";')

                print("Orphaned tables dropped. Re-running migration...")
                call_command('migrate', '--fake-initial', interactive=False)
                print("Migrations applied successfully after clearing orphaned tables.")
                return True

        # Case B: Pre-existing database schema where initial tables exist
        core_app_tables = {'api_drug', 'api_customer', 'api_staff', 'api_sale'}
        has_preexisting_schema = bool(core_app_tables.intersection(existing_tables))

        if has_preexisting_schema:
            print("Pre-existing application tables detected in database.")
            # Record applied migrations in topological dependency order to avoid InconsistentMigrationHistory
            for node in loader.graph.forwards_plan(('api', loader.graph.leaf_nodes('api')[0][1]) if loader.graph.leaf_nodes('api') else ()):
                if node not in applied:
                    app_label, migration_name = node
                    print(f"Recording pre-existing migration: {app_label}.{migration_name}")
                    recorder.record_applied(app_label, migration_name)

            # Re-run migrate to ensure all other apps (auth, admin, contenttypes, sessions) are synced
            call_command('migrate', '--fake-initial', interactive=False)
            print("Successfully synchronized all migrations with pre-existing database.")
            return True
        else:
            # Re-raise error if this is not due to pre-existing tables
            raise exc
    except Exception as final_exc:
        print(f"Critical error during safe migration: {final_exc}")
        raise

if __name__ == '__main__':
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    safe_migrate()
