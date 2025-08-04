# Google Sheets Service Account Setup Guide

This guide will help you complete the setup of Google Sheets as your backend using the service account we've already configured.

## Prerequisites

✅ **Service Account Created** - `share-with-me-sheets-backend@atlantean-facet-467809-r4.iam.gserviceaccount.com`  
✅ **Project ID** - `atlantean-facet-467809-r4`  
🔲 **Private Key** - Need to download from Google Cloud Console  
🔲 **Google Spreadsheet** - Need to create and configure  

## Step 1: Download Service Account Private Key

1. **Go to Google Cloud Console:**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Select project: `atlantean-facet-467809-r4`

2. **Navigate to Service Accounts:**
   - Go to "IAM & Admin" → "Service Accounts"
   - Find: `share-with-me-sheets-backend@atlantean-facet-467809-r4.iam.gserviceaccount.com`

3. **Download Private Key:**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Select "JSON" format
   - Download the JSON file
   - **Keep this file secure and never commit it to version control**

## Step 2: Create Your Google Spreadsheet

1. **Create a new Google Sheet:**
   - Go to [Google Sheets](https://sheets.google.com)
   - Click "Create" → "Blank spreadsheet"
   - Name it "ShareWithMe-Database"

2. **Get the Spreadsheet ID:**
   - Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part (long string of letters and numbers)

3. **Share with Service Account:**
   - Click "Share" button in Google Sheets
   - Add the service account email: `share-with-me-sheets-backend@atlantean-facet-467809-r4.iam.gserviceaccount.com`
   - Set permission to "Editor"
   - Click "Send"

## Step 3: Set Up Sheet Structure

Create the following tabs in your spreadsheet with these exact headers:

### Users Sheet
- Rename the first sheet to "Users"
- Add these headers in row 1:
```
A: id          B: email       C: firstName    D: lastName     E: phone
F: age         G: location    H: isVerified   I: profilePhotoUrl  J: bio
K: occupation  L: interests   M: personalityScores  N: propertyPreferences  O: created_at  P: updated_at
```

### QuizResults Sheet
- Create a new sheet called "QuizResults"
- Add headers:
```
A: id    B: userId    C: results    D: created_at
```

### PropertyListings Sheet
- Create a new sheet called "PropertyListings"
- Add headers:
```
A: id          B: title       C: description    D: address      E: suburb
F: state       G: postcode    H: propertyType   I: rentPerWeek  J: bond
K: availableFrom  L: leaseDuration  M: bedroomsTotal  N: bedroomsAvailable  O: bathrooms
P: parking     Q: features    R: images         S: ownerId      T: ownerName
U: ownerAge    V: created     W: verified
```

### ChatMessages Sheet
- Create a new sheet called "ChatMessages"
- Add headers:
```
A: id    B: senderId    C: receiverId    D: message    E: timestamp    F: type    G: read
```

### MarketplaceItems Sheet
- Create a new sheet called "MarketplaceItems"
- Add headers:
```
A: id        B: title       C: description    D: price       E: category
F: condition G: images      H: sellerId       I: sellerName  J: location
K: status    L: created     M: tags
```

### SupportRequests Sheet
- Create a new sheet called "SupportRequests"
- Add headers:
```
A: id    B: userId    C: name    D: email    E: subject    F: message    G: created_at    H: status
```

## Step 4: Configure the Application

You have two options for configuration:

### Option A: Using the Admin Panel (Recommended for Development)

1. **Access the admin panel:**
   - Go to your app
   - Add `#admin-sheets-config` to the URL
   - This will show a configuration panel

2. **Enter your credentials:**
   - Paste your Spreadsheet ID
   - Paste the entire contents of your JSON private key file
   - Click "Save Configuration"

### Option B: Manual Configuration (For Production)

1. **Open the JSON file** you downloaded from Google Cloud Console

2. **Find the private_key field** - it looks like:
   ```json
   {
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   }
   ```

3. **Update the configuration** in your deployment environment:
   - Set `GOOGLE_SPREADSHEET_ID` to your spreadsheet ID
   - Set `GOOGLE_PRIVATE_KEY` to the full private key (including the BEGIN/END lines)

## Step 5: Test the Integration

1. **Open your application**
2. **Create a test account** - check if a new row appears in your Users sheet
3. **Take the personality quiz** - check if results appear in QuizResults sheet
4. **Create a property listing** - check if it appears in PropertyListings sheet
5. **Send a chat message** - check if it appears in ChatMessages sheet

## Step 6: Admin Configuration Panel

I'll create a special admin panel for you to easily configure the app:

### Accessing Admin Panel:
- Add `#admin-sheets-config` to your app URL
- This provides a secure way to enter credentials during development

### Features:
- ✅ **Connection Testing** - Verify your setup works
- ✅ **Credential Management** - Securely store credentials in localStorage
- ✅ **Data Viewing** - See your spreadsheet data directly in the app
- ✅ **Backup/Export** - Download your data as needed

## Security Notes

🔒 **Production Security:**
- Never commit your private key to version control
- Use environment variables for production deployments
- Consider using secret management services for live apps
- Regularly rotate your service account keys

🛡️ **Access Control:**
- Only share spreadsheet with the service account (not publicly)
- Use "Editor" permissions (not "Owner")
- Monitor access logs in Google Cloud Console

## Troubleshooting

### Common Issues:

1. **"Authentication failed" error:**
   - Verify the private key is complete (including BEGIN/END lines)
   - Check that you've shared the spreadsheet with the service account
   - Ensure the service account has "Editor" permissions

2. **"Spreadsheet not found" error:**
   - Double-check the spreadsheet ID
   - Verify the spreadsheet is shared with the service account
   - Make sure the service account email is exactly: `share-with-me-sheets-backend@atlantean-facet-467809-r4.iam.gserviceaccount.com`

3. **"Sheet not found" error:**
   - Verify all sheet names match exactly (case-sensitive)
   - Check that column headers are correct
   - Ensure you have all required sheets created

4. **Data not appearing:**
   - Check browser console for error messages
   - Verify the sheet structure matches the expected format
   - Test the connection using the admin panel

### Getting Help:

If you encounter issues:
1. Check the browser console for detailed error messages
2. Use the admin panel's connection test feature
3. Verify your spreadsheet permissions and structure
4. Ensure your service account key is valid and complete

## Next Steps

Once configured, you'll have:
- ✅ **Full Backend Functionality** - All features work with Google Sheets
- ✅ **Real-time Data** - See user activity in your spreadsheet
- ✅ **Easy Management** - Edit data directly in Google Sheets
- ✅ **Backup Ready** - Export data anytime
- ✅ **Scalable** - Works for hundreds of users
- ✅ **Cost Effective** - No hosting fees for the database

Your ShareWithMe platform is now ready to go live! 🚀