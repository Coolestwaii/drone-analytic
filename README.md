# -------------------------------------
# 🚀 How to run the Next.js frontend
# -------------------------------------
# ✅ Prerequisites:
# - Node.js (v20.14.0 is what this project is build on)
# - npm (v10.7.0 is what this project is build on)
# - Python FastAPI server must be running BEFORE running the frontend

## 1.
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
$ python3 -m venv venv
$ source venv/bin/activate

# 2. Install required dependencies for FastAPI
$ pip install --upgrade pip
$ pip install -r fastapiserver/requirements.txt

# 3. Run the FastAPI app (from the project root!)
$ uvicorn fastapiserver.main:app --host 0.0.0.0 --port 8000

# -------------------------------------
# 🪟 Windows setup steps (PowerShell or CMD):
# -------------------------------------

# 1. Create a virtual environment
$ python -m venv venv

# 2. Activate the environment
$ cd venv\Scripts
$ .\activate

# 3. Go back to the Next.js root
$ cd ../..

# 4. Install dependencies
$ pip install --upgrade pip
$ pip install -r fastapiserver/requirements.txt

# 5. Run FastAPI from the root
$ uvicorn fastapiserver.main:app --host 0.0.0.0 --port 8000

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

## 2.
# -------------------------------------
# 🐳 How to run Docker containers for MongoDB, PostgreSQL and NodeODM
# -------------------------------------
# ✅ Prerequisites:
# - Docker + Docker Compose must be installed
# - .env file must exist in the project root (already included)
# 🔐 Environment Variables You Must Provide Yourself
# Some sensitive credentials are not included in the .env file and must be generated or retrieved manually:

$ env.local
$ GOOGLE_CLIENT_ID=...
$ GOOGLE_CLIENT_SECRET=...
$ NEXTAUTH_SECRET=...


# -------------------------------------
# ▶️ 1. Start the containers
$ docker-compose up -d
#
# This will start:
# - 🟡 MongoDB at port 27017
# - 🔵 PostgreSQL at port 5432
# - 🟢 NodeODM at port 3001
# -------------------------------------
# ▶️ 2. Check that containers are running
$ docker ps
#
# You should see:
# - dronemongo
# - dronepostgres
# - nodeodm
# -------------------------------------
# ▶️ 3. Create the Postgres app user and grant access
$ docker exec -it dronepostgres psql -U postgres -d dronedb
#
# Then run these SQL commands inside:
$ CREATE USER appuser WITH PASSWORD '12345678'; GRANT ALL PRIVILEGES ON DATABASE dronedb TO appuser; GRANT ALL PRIVILEGES ON SCHEMA public TO appuser; \q
#
# -------------------------------------
# ▶️ 4. Run Prisma to create tables
$ npx prisma generate
$ npx prisma migrate dev --name init
#
# -------------------------------------
# Done! PostgreSQL and MongoDB are running,
# NodeODM is ready to accept processing jobs.
# Now go to step 3 to run the Next.js app frontend.


## 3.
# -------------------------------------
# 📦 How to run Flask Server fo Machine Leaning Model Inference
# -------------------------------------

# Before running the system, make sure to set the public NGROK URLs for each service in your environment variables or .env file:

env

$ FLASK_BUILDING_URL=https://your-ngrok-url-for-building.ngrok.io
$ FLASK_GCP_URL=https://your-ngrok-url-for-gcp.ngrok.io
# ✅ Quick Start
# Get your NGROK auth token
# Go to https://dashboard.ngrok.com/get-started and copy your auth token.

# Paste the token into the notebook cell
# Inside the notebook, find the cell that looks like this:

$ python

$ !ngrok config add-authtoken YOUR_NGROK_TOKEN
# Replace YOUR_NGROK_TOKEN with your actual token.

# Run all cells
# Just click "Run All" in your Jupyter notebook. This will:

# Start the Flask server

# Load your model

# Expose the server via NGROK

# Print the public NGROK URL to use in your .env file

# Copy the printed NGROK URL
# Update your .env file with the printed NGROK URL so your frontend or orchestrator can call the API.

# Once done, your Flask server will be up and ready to receive inference requests 🎯


## 4.
# -------------------------------------
# 📦 How to run this Next.js project
# -------------------------------------
# 🧪 If not installed:
# Install Node.js from https://nodejs.org/en/download (select v20.x)

# -------------------------------------
# ▶ 1. Install frontend dependencies
$ npm install

# -------------------------------------
▶ 2. Run the frontend in development mode
$ npm run dev

# The app will be available at:
# 👉 http://localhost:3000

# -------------------------------------
# 🛠 Optional: Build and start in production mode (if needed)
$ npm run build
$ npm run start

# -------------------------------------
# 💡 Trouble with dependencies?
# If `npm install` fails due to OS or version mismatch, try deleting node_modules and   reinstall:

$ rm -rf node_modules package-lock.json  # Linux/macOS
$ rd /s /q node_modules package-lock.json # Windows CMD
$ del /s /q node_modules\* package-lock.json # PowerShell

# Then reinstall:

$ npm install

# -------------------------------------
# 🧪 Node and npm versions used in development:
# - Node.js v20.14.0
# - npm v10.7.0

# You can check yours with:
$ node -v
$ npm -v


# ⚠️ Limitations with npm run build (Production Build)
# In some environments, especially when using Leaflet with Next.js, you may encounter errors like:

javascript

% ReferenceError: window is not defined %

# This happens because:

# Leaflet (and some other browser-only libraries) depend on the window object which is not  available during SSR (Server-Side Rendering).

# Next.js tries to prerender pages during next build, which executes code in a Node.js environment — not the browser.

# Workaround (Use npm run dev instead) If npm run build fails due to window is not defined, you can still run the app using:


$ npm run dev
# This starts the app in development mode where all rendering is handled client-side, and window is accessible.

#💡 Why Leaflet causes issues
 Leaflet does not officially support SSR. Even when marked with "use client" or dynamic(..., { ssr: false }), some of its sub-dependencies or plugins still assume window is present at build-time, leading to crashes during static optimization or production export.

# Poosible Solutions:

# Refactor components to import Leaflet only after typeof window !== 'undefined'

# Or skip production builds entirely and run in dev mode for demos, presentations, or internal testing.