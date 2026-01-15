# Apache Server Deployment Guide

## Production Build Created Successfully!

Your ASO Keyword Research application has been built for production. Follow these steps to deploy it on your Apache server.

---

## 📁 Production Files

### Frontend (Static Files)
- **Location**: `frontend/dist/`
- **Files**: `index.html`, `assets/` folder with CSS and JavaScript

### Backend (Node.js Server)
- **Required Files**: All files in `src/` folder, `package.json`, `.env`, `prisma/` folder

---

## 🚀 Deployment Steps

### Step 1: Deploy Frontend to Apache

1. **Copy the built frontend files** to your Apache web server directory:
   ```bash
   # Windows (adjust path to your Apache htdocs folder)
   xcopy /E /I "C:\Users\shant\Documents\KeyWordResearch\ai-keywords-search\frontend\dist\*" "C:\xampp\htdocs\aso-platform\"
   ```

2. **Create or update `.htaccess`** in your Apache directory for React Router:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

3. **Verify Apache has mod_rewrite enabled**:
   - In `httpd.conf`, ensure this line is uncommented:
     ```apache
     LoadModule rewrite_module modules/mod_rewrite.so
     ```
   - Also ensure `AllowOverride All` is set for your directory

4. **Restart Apache**

---

### Step 2: Deploy Backend as Windows Service

The backend needs to run continuously. You have two options:

#### Option A: Using PM2 (Recommended)

1. **Install PM2 globally** (if not already installed):
   ```bash
   npm install -g pm2
   ```

2. **Start the backend server** in the project root:
   ```bash
   cd C:\Users\shant\Documents\KeyWordResearch\ai-keywords-search
   pm2 start src/index.js --name "aso-backend"
   ```

3. **Save PM2 configuration** to restart on reboot:
   ```bash
   pm2 save
   pm2 startup
   ```
   Follow the instructions PM2 provides to set up automatic startup.

4. **Useful PM2 commands**:
   ```bash
   pm2 status              # Check status
   pm2 logs aso-backend    # View logs
   pm2 restart aso-backend # Restart server
   pm2 stop aso-backend    # Stop server
   pm2 delete aso-backend  # Remove from PM2
   ```

#### Option B: Using Node.js Windows Service

1. **Install node-windows globally**:
   ```bash
   npm install -g node-windows
   ```

2. **Create service script** `install-service.js`:
   ```javascript
   var Service = require('node-windows').Service;

   var svc = new Service({
     name: 'ASO Backend Service',
     description: 'ASO Keyword Research Backend API',
     script: 'C:\\Users\\shant\\Documents\\KeyWordResearch\\ai-keywords-search\\src\\index.js',
     nodeOptions: [
       '--harmony',
       '--max_old_space_size=4096'
     ],
     env: {
       name: "NODE_ENV",
       value: "production"
     }
   });

   svc.on('install', function(){
     svc.start();
   });

   svc.install();
   ```

3. **Run the service installer**:
   ```bash
   node install-service.js
   ```

---

### Step 3: Configure API Endpoint

The frontend needs to know where the backend is running.

1. **Update frontend API base URL** in `frontend/src/lib/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://localhost:3000/api'; // For local development

   // For production (if backend is on different domain):
   const API_BASE_URL = 'http://your-domain.com:3000/api';
   ```

2. **Rebuild frontend** if you changed the API URL:
   ```bash
   cd frontend
   npm run build
   ```
   Then copy the new dist files to Apache again.

---

### Step 4: Environment Variables

Ensure your `.env` file is configured correctly:

```env
# Server Configuration
PORT=3000

# Database
DATABASE_URL="file:./prisma/aso.db"

# API Keys (REQUIRED for full functionality)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS (if frontend is on different domain)
ALLOWED_ORIGINS=http://localhost:5173,http://your-domain.com
```

**Important**: If you're accessing from a different domain, update `ALLOWED_ORIGINS`.

---

## 🔧 No More npm Commands Needed!

Once deployed:
- **Frontend**: Served directly by Apache (no npm needed)
- **Backend**: Runs automatically via PM2 or Windows Service (no manual start needed)

To access your application:
- **Frontend**: `http://localhost/` (or your Apache domain)
- **Backend API**: `http://localhost:3000/api/`

---

## 🛠️ Troubleshooting

### Frontend doesn't load
1. Check Apache error logs
2. Verify files are in correct htdocs directory
3. Ensure .htaccess is present and mod_rewrite is enabled

### Backend API not responding
1. **Check if backend is running**:
   ```bash
   pm2 status
   ```
2. **View backend logs**:
   ```bash
   pm2 logs aso-backend
   ```
3. **Check port 3000 is not blocked by firewall**

### CORS errors
1. Update `ALLOWED_ORIGINS` in `.env` to include your frontend domain
2. Restart backend: `pm2 restart aso-backend`

---

## 📊 Database

Your SQLite database is located at:
- `prisma/aso.db`

**Backup your database regularly**:
```bash
copy "C:\Users\shant\Documents\KeyWordResearch\ai-keywords-search\prisma\aso.db" "C:\Backups\aso.db.backup"
```

---

## 🔄 Updates

When you make changes to the code:

### Frontend Changes:
```bash
cd C:\Users\shant\Documents\KeyWordResearch\ai-keywords-search\frontend
npm run build
xcopy /E /I dist\* C:\xampp\htdocs\aso-platform\
```

### Backend Changes:
```bash
pm2 restart aso-backend
```

---

## 🎉 You're Done!

Your application is now running on Apache and doesn't require any terminal commands to stay online. It will:
- ✅ Start automatically when Windows boots
- ✅ Restart automatically if it crashes
- ✅ Serve static files efficiently via Apache
- ✅ Run the backend API continuously

Access your application at: `http://localhost/` or your configured domain.
