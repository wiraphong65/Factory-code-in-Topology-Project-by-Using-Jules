"""
Migration script to add AI Analysis History table and update existing tables
"""
import sqlite3
from datetime import datetime

def migrate_database():
    conn = sqlite3.connect('network_topology.db')
    cursor = conn.cursor()
    
    try:
        print("Starting database migration...")
        
        # 1. Add new columns to users table
        print("Adding total_analyses column to users table...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN total_analyses INTEGER DEFAULT 0")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("Column total_analyses already exists in users table")
            else:
                raise e
        
        # 2. Add new columns to projects table
        print("Adding analysis_count and last_analysis_at columns to projects table...")
        try:
            cursor.execute("ALTER TABLE projects ADD COLUMN analysis_count INTEGER DEFAULT 0")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("Column analysis_count already exists in projects table")
            else:
                raise e
        
        try:
            cursor.execute("ALTER TABLE projects ADD COLUMN last_analysis_at TIMESTAMP")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("Column last_analysis_at already exists in projects table")
            else:
                raise e
        
        # 3. Create ai_analysis_history table
        print("Creating ai_analysis_history table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                project_id INTEGER,
                model_used VARCHAR(100) NOT NULL,
                device_count INTEGER NOT NULL,
                device_types TEXT,
                analysis_result TEXT NOT NULL,
                execution_time_seconds INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
            )
        """)
        
        # 4. Create indexes for better performance
        print("Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON ai_analysis_history(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_history_project_id ON ai_analysis_history(project_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON ai_analysis_history(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_history_model_used ON ai_analysis_history(model_used)")
        
        # 5. Update existing users to have total_analyses = 0 if NULL
        print("Updating existing users...")
        cursor.execute("UPDATE users SET total_analyses = 0 WHERE total_analyses IS NULL")
        
        # 6. Update existing projects to have analysis_count = 0 if NULL
        print("Updating existing projects...")
        cursor.execute("UPDATE projects SET analysis_count = 0 WHERE analysis_count IS NULL")
        
        conn.commit()
        print("Migration completed successfully!")
        
        # Show table structure
        print("\nNew table structure:")
        cursor.execute("PRAGMA table_info(ai_analysis_history)")
        columns = cursor.fetchall()
        for column in columns:
            print(f"  {column[1]} {column[2]} {'NOT NULL' if column[3] else 'NULL'}")
        
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()