# -------------------------------------
# 🚀 How to run the Next.js frontend
# -------------------------------------
# ✅ Prerequisites:
# - Node.js (v20.14.0 is what this project is build on)
# - npm (v10.7.0 is what this project is build on)
# - Python FastAPI server must be running BEFORE running the frontend

1.
# -------------------------------------
# 📦 How to run the FastAPI backend inside your Next.js project
# -------------------------------------
# ✅ Prerequisites:
# - Python 3.11 must be installed
# - This assumes FastAPI lives inside your Next.js project (see structure below)

# 📁 Project folder structure (expected):
#
# nextjs-project-root/
# ├── .env                   <-- Shared .env used by BOTH Next.js and FastAPI
# ├── fastapiserver/               <-- FastAPI backend lives here
# │   ├── main.py
# │   └── requirements.txt
# └── (Next.js files like pages/, public/, etc.)

# -------------------------------------
# 🐧 Linux / macOS setup steps:
# -------------------------------------

# 1. Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install required dependencies for FastAPI
pip install --upgrade pip
pip install -r fastapiserver/requirements.txt

# 3. Run the FastAPI app (from the project root!)
uvicorn fastapiserver.main:app --host 0.0.0.0 --port 8000

# -------------------------------------
# 🪟 Windows setup steps (PowerShell or CMD):
# -------------------------------------

# 1. Create a virtual environment
python -m venv venv

# 2. Activate the environment
cd venv\Scripts
.\activate

# 3. Go back to the Next.js root
cd ../..

# 4. Install dependencies
pip install --upgrade pip
pip install -r fastapiserver/requirements.txt

# 5. Run FastAPI from the root
uvicorn fastapiserver.main:app --host 0.0.0.0 --port 8000

# -------------------------------------
# 💡 ENV Usage Note:
# - FastAPI and Next.js will both use `.env` in the project root
# - Inside fastapiserver/main.py you should load it like this:

#     from dotenv import load_dotenv
#     load_dotenv()  # Automatically loads from root if you run from root

# 👉 If you want to use a separate .env for FastAPI (not shared),
# replace with:
#     load_dotenv(dotenv_path="fastapiserver/.env")

# -------------------------------------
# ✅ That’s it! You now have a working FastAPI + Next.js project sharing one .env

2.
# -------------------------------------
# 📦 How to run this Next.js project
# -------------------------------------
# 🧪 If not installed:
# Install Node.js from https://nodejs.org/en/download (select v20.x)

# -------------------------------------
# ▶️ 1. Install frontend dependencies
npm install

# -------------------------------------
# ▶️ 2. Run the frontend in development mode
npm run dev

# The app will be available at:
# 👉 http://localhost:3000

# -------------------------------------
# 🛠 Optional: Build and start in production mode (if needed)
npm run build
npm run start

# -------------------------------------
# 💡 Trouble with dependencies?
# If `npm install` fails due to OS or version mismatch, try deleting node_modules and reinstall:

rm -rf node_modules package-lock.json  # Linux/macOS
rd /s /q node_modules package-lock.json # Windows CMD
del /s /q node_modules\* package-lock.json # PowerShell

Then reinstall:

npm install

# -------------------------------------
# 🧪 Node and npm versions used in development:
# - Node.js v20.14.0
# - npm v10.7.0

# You can check yours with:
node -v
npm -v