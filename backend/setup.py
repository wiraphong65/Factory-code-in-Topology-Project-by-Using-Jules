# #!/usr/bin/env python3
# """
# Setup script for Network Topology Backend
# """

# import os
# import subprocess
# import sys
# from pathlib import Path

# def run_command(command, description):
#     """Run a command and handle errors"""
#     print(f"🔄 {description}...")
#     try:
#         result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
#         print(f"✅ {description} completed successfully")
#         return True
#     except subprocess.CalledProcessError as e:
#         print(f"❌ {description} failed:")
#         print(f"Error: {e.stderr}")
#         return False

# def create_env_file():
#     """Create .env file if it doesn't exist"""
#     env_file = Path(".env")
#     if not env_file.exists():
#         print("📝 Creating .env file...")
#         env_content = """DATABASE_URL=postgresql://user:password@localhost/network_topology_db
# SECRET_KEY=your-super-secret-key-here-change-this-in-production
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30

# # Ollama Configuration
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3.2
# OLLAMA_TIMEOUT=30
# """
#         with open(env_file, "w") as f:
#             f.write(env_content)
#         print("✅ .env file created")
#         print("⚠️  Please update the DATABASE_URL and SECRET_KEY in .env file")
#         print("🤖 Ollama configuration added - make sure Ollama is running on http://localhost:11434")
#     else:
#         print("✅ .env file already exists")

# def setup_alembic():
#     """Setup Alembic for database migrations"""
#     if not Path("alembic").exists():
#         print("🔄 Initializing Alembic...")
#         if not run_command("alembic init alembic", "Initializing Alembic"):
#             return False
        
#         # Update alembic.ini
#         print("📝 Updating alembic.ini...")
#         with open("alembic.ini", "r") as f:
#             content = f.read()
        
#         content = content.replace(
#             "sqlalchemy.url = driver://user:pass@localhost/dbname",
#             "sqlalchemy.url = postgresql://user:password@localhost/network_topology_db"
#         )
        
#         with open("alembic.ini", "w") as f:
#             f.write(content)
        
#         print("✅ Alembic setup completed")
#     else:
#         print("✅ Alembic already initialized")

# def main():
#     """Main setup function"""
#     print("🚀 Setting up Network Topology Backend...")
    
#     # Check if we're in the right directory
#     if not Path("requirements.txt").exists():
#         print("❌ requirements.txt not found. Please run this script from the backend directory.")
#         sys.exit(1)
    
#     # Create virtual environment if it doesn't exist
#     venv_path = Path("venv")
#     if not venv_path.exists():
#         print("🔄 Creating virtual environment...")
#         if not run_command("python -m venv venv", "Creating virtual environment"):
#             sys.exit(1)
    
#     # Determine activation command based on OS
#     if os.name == 'nt':  # Windows
#         activate_cmd = "venv\\Scripts\\activate"
#         pip_cmd = "venv\\Scripts\\pip"
#     else:  # Unix/Linux/Mac
#         activate_cmd = "source venv/bin/activate"
#         pip_cmd = "venv/bin/pip"
    
#     # Install dependencies
#     if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing dependencies"):
#         sys.exit(1)
    
#     # Create .env file
#     create_env_file()
    
#     # Setup Alembic
#     setup_alembic()
    
#     print("\n🎉 Setup completed successfully!")
#     print("\n📋 Next steps:")
#     print("1. Update the DATABASE_URL in .env file with your PostgreSQL connection string")
#     print("2. Update the SECRET_KEY in .env file with a secure secret key")
#     print("3. Create the database: createdb network_topology_db")
#     print("4. Run migrations: alembic upgrade head")
#     print("5. Start the server: python run.py")
#     print("\n🔗 API will be available at: http://localhost:8000")
#     print("📚 API documentation: http://localhost:8000/docs")

# if __name__ == "__main__":
#     main() 