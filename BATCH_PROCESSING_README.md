# 🚀 Batch Processing System for QuickBooks Products

## 📋 Overview

The Batch Processing System allows you to efficiently create products in your database from parsed QuickBooks data files. Instead of processing all products at once (which could overwhelm the database), it processes them in configurable batches (100, 200, 300, etc.).

## 🎯 Key Features

- ✅ **Configurable Batch Sizes**: Process 50, 100, 200, 500, or any custom size
- ✅ **Multiple File Support**: Process all parsed data files or specific files
- ✅ **Duplicate Prevention**: Smart duplicate detection and handling
- ✅ **Progress Tracking**: Real-time progress monitoring for each batch
- ✅ **Error Handling**: Continues processing even if individual items fail
- ✅ **Database Optimization**: Small delays between batches to prevent overwhelming

## 🔧 How It Works

### 1. **Data Flow**

```
QuickBooks → XML Response → Parsed Data Files → Batch Processing → Database
```

### 2. **Batch Processing Steps**

1. **Read Parsed Files**: Load parsed data from `logs/parsed_data_N.json` files
2. **Split into Batches**: Divide items into chunks of specified size
3. **Process Each Batch**: Create/update products in database
4. **Track Progress**: Monitor success/failure for each batch
5. **Handle Errors**: Continue processing even if individual items fail

### 3. **Batch Sizes Available**

- **Small**: 50-100 items (recommended for testing)
- **Medium**: 100-200 items (recommended for production)
- **Large**: 200-500 items (for high-performance systems)
- **Custom**: Any size between 1-1000

## 📡 API Endpoints

### **Get Batch Processing Status**

```http
GET /api/batch/status
```

**Response**: Shows available parsed files, total items, and batch processing capabilities.

### **Start Batch Processing (All Files)**

```http
POST /api/batch/start
Content-Type: application/json

{
  "batchSize": 100,
  "sourceFile": null
}
```

**Response**: Processes all parsed data files with specified batch size.

### **Process Specific File**

```http
POST /api/batch/process-file
Content-Type: application/json

{
  "filename": "parsed_data_1.json",
  "batchSize": 75
}
```

**Response**: Processes only the specified file with specified batch size.

### **List Available Files**

```http
GET /api/batch/files
```

**Response**: Detailed list of all parsed data files available for processing.

## 🚀 Usage Examples

### **Example 1: Process All Files with 100-item Batches**

```bash
curl -X POST http://localhost:8000/api/batch/start \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 100}'
```

### **Example 2: Process Specific File with 200-item Batches**

```bash
curl -X POST http://localhost:8000/api/batch/process-file \
  -H "Content-Type: application/json" \
  -d '{"filename": "parsed_data_2.json", "batchSize": 200}'
```

### **Example 3: Check Available Files**

```bash
curl http://localhost:8000/api/batch/files
```

### **Example 4: Get Processing Status**

```bash
curl http://localhost:8000/api/batch/status
```

## 🧪 Testing

### **Run Test Script**

```bash
node test-batch-processing.js
```

This will:

1. Check available parsed data files
2. Test different batch sizes
3. Process specific files
4. Show results and statistics

### **Manual Testing Steps**

1. **Start your server**: `node app.js`
2. **Check status**: `GET /api/batch/status`
3. **Start processing**: `POST /api/batch/start` with `{"batchSize": 100}`
4. **Monitor progress**: Watch console logs for real-time updates
5. **Check results**: Verify products in your database

## 📊 Expected Output

### **Console Output During Processing**

```
🔄 Starting batch processing with batch size: 100
📁 Found 2 parsed data files to process

📄 Processing file: parsed_data_1.json
📊 File contains 150 items
🔄 Processing 150 items in 2 batches of 100

📦 Processing batch 1/2 (items 1-100)
✅ Batch 1 completed: 100 items processed
📊 Batch summary: Created=95, Updated=5, Skipped=0

📦 Processing batch 2/2 (items 101-150)
✅ Batch 2 completed: 50 items processed
📊 Batch summary: Created=48, Updated=2, Skipped=0

✅ File parsed_data_1.json processed: 150 items in 2 batches

🎯 Batch processing completed!
📊 Total items processed: 150
📊 Total batches executed: 2
📊 Total files processed: 1
```

### **API Response Example**

```json
{
  "success": true,
  "message": "Batch processing completed successfully",
  "data": {
    "batchTime": "2025-08-21T10:30:00.000Z",
    "batchSize": 100,
    "sourceFile": "All parsed data files",
    "result": {
      "processed": 150,
      "batches": 2,
      "files": 1,
      "batchSize": 100
    }
  }
}
```

## ⚙️ Configuration

### **Environment Variables**

```bash
# Database connection (already configured)
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

# Server configuration
SERVER_PORT=8000
```

### **Batch Size Recommendations**

| Use Case             | Batch Size | Description                     |
| -------------------- | ---------- | ------------------------------- |
| **Development**      | 50-100     | Safe for testing and debugging  |
| **Production**       | 100-200    | Balanced performance and safety |
| **High Performance** | 200-500    | For powerful servers            |
| **Custom**           | 1-1000     | Based on your specific needs    |

## 🔍 Troubleshooting

### **Common Issues**

#### **1. No Parsed Data Files Found**

**Problem**: `No parsed data files found to process`
**Solution**: Run a QuickBooks sync first to generate parsed data files.

#### **2. Database Connection Errors**

**Problem**: Database connection failures during batch processing
**Solution**: Check database credentials and connection settings.

#### **3. Memory Issues with Large Batches**

**Problem**: Out of memory errors with very large batch sizes
**Solution**: Reduce batch size to 100-200 items.

#### **4. Slow Processing**

**Problem**: Batch processing is taking too long
**Solution**: Increase batch size or check database performance.

### **Debug Mode**

Enable detailed logging by checking console output:

- ✅ Success messages
- ⚠️ Warning messages
- ❌ Error messages
- 📊 Progress updates

## 📈 Performance Tips

### **1. Optimal Batch Sizes**

- **Start with 100**: Good balance of speed and safety
- **Increase gradually**: Test with 200, 300, 500
- **Monitor performance**: Watch database response times

### **2. Database Optimization**

- Ensure proper indexes on `quickbook_list_id` and `name` columns
- Monitor database performance during processing
- Consider running during off-peak hours

### **3. System Resources**

- Monitor memory usage during large batch processing
- Ensure adequate disk space for logs
- Check CPU usage during processing

## 🔄 Integration with Existing System

### **Automatic Sync + Batch Processing**

1. **QuickBooks sync** runs every 20 seconds (creates parsed data files)
2. **Batch processing** can be triggered manually or via API
3. **Database** gets populated with products efficiently
4. **Monitoring** via API endpoints and console logs

### **Workflow**

```
1. Start server → QuickBooks sync begins automatically
2. Wait for sync to complete → Check for parsed data files
3. Start batch processing → Choose batch size and files
4. Monitor progress → Watch console logs and API responses
5. Verify results → Check database for created products
```

## 📝 File Structure

```
logs/
├── timestamp_1.xml          # QuickBooks XML responses
├── timestamp_2.xml
├── parsed_data_1.json      # Parsed product data
├── parsed_data_2.json
├── error_1.json            # Error logs
└── error_2.json
```

## 🎉 Success Metrics

- ✅ **Products Created**: New products added to database
- ✅ **Products Updated**: Existing products updated with latest data
- ✅ **Batches Processed**: Number of successful batch operations
- ✅ **Files Processed**: Number of parsed data files processed
- ✅ **Error Rate**: Percentage of items that failed to process

## 🚀 Next Steps

1. **Start your server**: `node app.js`
2. **Check available files**: `GET /api/batch/status`
3. **Start batch processing**: `POST /api/batch/start`
4. **Monitor progress**: Watch console logs
5. **Verify results**: Check your database

## 💡 Support

If you encounter issues:

1. Check console logs for error messages
2. Verify parsed data files exist in `logs/` directory
3. Ensure database connection is working
4. Try smaller batch sizes for testing
5. Check API endpoint responses for detailed error information

---

**Happy Batch Processing! 🎯**
