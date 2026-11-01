import os
import sys
import django

def drop_tables(tables, cascade=True):
    """
    Safely drops specified database tables from the configured Django database.
    Usage: python delete_table.py table1 [table2 ...]
    Example: python delete_table.py api_customer
    """
    from django.db import connection

    existing_tables = set(connection.introspection.table_names())
    print(f"Connecting to database backend: {connection.vendor}")
    print(f"Total tables in database: {len(existing_tables)}")

    dropped = []
    with connection.cursor() as cursor:
        for raw_name in tables:
            clean_name = ''.join(c for c in raw_name.strip() if c.isalnum() or c == '_')
            if not clean_name:
                continue

            if clean_name not in existing_tables:
                print(f"Table '{clean_name}' does not exist in database (skipped).")
                continue

            print(f"Dropping table '{clean_name}'...")
            if connection.vendor == 'postgresql' and cascade:
                cursor.execute(f'DROP TABLE IF EXISTS "{clean_name}" CASCADE;')
            else:
                cursor.execute(f'DROP TABLE IF EXISTS "{clean_name}";')
            dropped.append(clean_name)
            print(f"Successfully dropped table '{clean_name}'.")

    return dropped

if __name__ == '__main__':
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()

    args = [arg.strip() for arg in sys.argv[1:] if arg.strip()]
    if not args:
        print("Usage: python delete_table.py <table_name> [<table_name2> ...]")
        print("Example: python delete_table.py api_customer")
        sys.exit(1)

    drop_tables(args)
