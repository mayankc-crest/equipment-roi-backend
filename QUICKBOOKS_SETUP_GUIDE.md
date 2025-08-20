# QuickBooks Web Connector Setup Guide

## Prerequisites

### 1. QuickBooks Desktop Requirements

- **QuickBooks Desktop** (Pro, Premier, or Enterprise) must be installed
- **QuickBooks must be running** before starting the Web Connector
- **Single-user mode** is recommended (not multi-user mode)
- **Company file must be open** in QuickBooks

### 2. QuickBooks Web Connector

- Download and install **QuickBooks Web Connector** from Intuit
- Version 2.0.1 or higher recommended

## Setup Steps

### Step 1: Prepare QuickBooks

1. **Open QuickBooks Desktop**
2. **Open your company file**
3. **Ensure QuickBooks is in single-user mode**
4. **Keep QuickBooks running** (don't close it)

### Step 2: Configure Web Connector

1. **Open QuickBooks Web Connector**
2. **Add Application** with these settings:
   - **Application Name**: Your App Name
   - **URL**: `http://localhost:8000/wsdl`
   - **Username**: `admin`
   - **Password**: `password`
   - **Company File**: Leave blank (will use currently open file)

### Step 3: Test Connection

1. **Click "Update Selected"** in Web Connector
2. **Check server logs** for authentication success
3. **Monitor QuickBooks** for any prompts or errors

## Troubleshooting

### "Could not start QuickBooks" Error

**Common Causes:**

1. **QuickBooks not running** - Start QuickBooks first
2. **Company file not open** - Open your company file in QuickBooks
3. **Multi-user mode** - Switch to single-user mode
4. **Wrong company file path** - Use currently open file

**Solutions:**

1. **Start QuickBooks** and open your company file
2. **Close QuickBooks Web Connector**
3. **Restart QuickBooks Web Connector**
4. **Try the connection again**

### Authentication Issues

- Ensure username is exactly: `admin`
- Ensure password is exactly: `password`
- Check server logs for authentication details

### Connection Issues

- Verify server is running on port 8000
- Check firewall settings
- Ensure URL is correct: `http://localhost:8000/wsdl`

## Environment Variables

Create a `.env` file with:

```env
QB_USERNAME=admin
QB_PASSWORD=password
QB_COMPANY_FILE=  # Leave empty to use currently open file
SERVER_PORT=8000
```

## Server Logs

Monitor these log messages:

- ✅ `🔧 Environment variables loaded`
- ✅ `🔐 Authentication attempt`
- ✅ `📁 Company file configuration`
- ❌ `🔴 QB CONNECTION ERROR`

## Next Steps After Connection

Once connected successfully:

1. **Monitor server logs** for qbXML requests
2. **Check QuickBooks** for data synchronization
3. **Verify data** is being transferred correctly
