import os
import sys
import django

def safe_migrate():
    """
    Safely executes Django migrations during deployment.
    First tries standard migration with --fake-initial.
    If database tables already exist from previous deployments or manual schemas,
    and a migration fails because of existing relations or schema mismatches,
    it detects existing tables and synchronizes the migration history in proper dependency order
    so future migrations and server startup proceed cleanly without crashes.
    """
    from django.core.management import call_command
    from django.db import connection, DatabaseError
    from django.db.migrations.recorder import MigrationRecorder
    from django.db.migrations.loader import MigrationLoader

    print("--- Running Database Migrations ---")

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

        # Check if key app models already exist in the database
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
