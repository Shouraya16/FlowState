"""
Run this ONCE to add the new TaskStatus enum values to PostgreSQL.
Usage:
    cd backend
    python migrate_enums.py
"""

import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:sam1405@localhost:5432/flowstate_db"
)

engine = create_engine(DATABASE_URL)

NEW_TASK_STATUSES = [
    "DESIGN_IN_PROGRESS",
    "DESIGN_COMPLETE",
    "READY_FOR_QA",
    "PASSED",
    "FAILED",
    "READY_TO_DEPLOY",
    "DEPLOYED",
]

def migrate():
    with engine.connect() as conn:
        # Check existing enum values
        result = conn.execute(text("""
            SELECT enumlabel
            FROM pg_enum
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
            WHERE pg_type.typname = 'taskstatus'
        """))
        existing = {row[0] for row in result}
        print(f"Existing taskstatus values: {existing}")

        # Add missing values
        for val in NEW_TASK_STATUSES:
            if val not in existing:
                conn.execute(text(
                    f"ALTER TYPE taskstatus ADD VALUE IF NOT EXISTS '{val}'"
                ))
                print(f"  ✅ Added: {val}")
            else:
                print(f"  — Already exists: {val}")

        conn.commit()
        print("\nMigration complete.")

        # Also check requeststatus has APPROVED
        result2 = conn.execute(text("""
            SELECT enumlabel
            FROM pg_enum
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
            WHERE pg_type.typname = 'requeststatus'
        """))
        existing2 = {row[0] for row in result2}
        print(f"\nExisting requeststatus values: {existing2}")

        for val in ["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED"]:
            if val not in existing2:
                conn.execute(text(
                    f"ALTER TYPE requeststatus ADD VALUE IF NOT EXISTS '{val}'"
                ))
                print(f"  ✅ Added to requeststatus: {val}")

        conn.commit()
        print("Done.")

if __name__ == "__main__":
    migrate()