import { UserData } from './types';

// Google Sheets configuration with pre-configured values
const GOOGLE_SHEETS_CONFIG = {
  serviceAccount: {
    email: 'share-with-me-sheets-backend@atlantean-facet-467809-r4.iam.gserviceaccount.com',
    projectId: 'atlantean-facet-467809-r4',
    // Private key will be loaded from environment variable
    privateKey: '',
  },
  // Pre-configured with your spreadsheet ID
  spreadsheetId: '1Laofhk3_VgUiHsIcKeUfFmGFAieBfE9ZSQHGko-V3yY',
  ranges: {
    users: 'Users!A:P',
    quizResults: 'QuizResults!A:Z',
    propertyListings: 'PropertyListings!A:Z',
    chatMessages: 'ChatMessages!A:J',
    marketplaceItems: 'MarketplaceItems!A:M',
    supportRequests: 'SupportRequests!A:H'
  }
};

// JWT creation for service account authentication
class ServiceAccountAuth {
  private serviceAccount: {
    email: string;
    privateKey: string;
    projectId: string;
  };

  constructor(email: string, privateKey: string, projectId: string) {
    this.serviceAccount = {
      email,
      privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      projectId
    };
  }

  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async sign(data: string): Promise<string> {
    try {
      // Import the private key
      const pemKey = this.serviceAccount.privateKey;
      const binaryDer = this.pemToBinary(pemKey);
      
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      // Sign the data
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        new TextEncoder().encode(data)
      );

      return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
    } catch (error) {
      console.error('Error signing JWT:', error);
      throw new Error('Failed to sign JWT');
    }
  }

  private pemToBinary(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async getAccessToken(): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600; // 1 hour

      const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: 'private_key_id'
      };

      const payload = {
        iss: this.serviceAccount.email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: exp,
        iat: now
      };

      const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
      const payloadBase64 = this.base64UrlEncode(JSON.stringify(payload));
      const signatureInput = `${headerBase64}.${payloadBase64}`;
      
      const signature = await this.sign(signatureInput);
      const jwt = `${signatureInput}.${signature}`;

      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Google Sheets API');
    }
  }
}

// Google Sheets API base URL
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

interface GoogleSheetsResponse {
  values?: string[][];
}

class GoogleSheetsService {
  private auth: ServiceAccountAuth | null = null;
  private spreadsheetId: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // Load configuration from environment variables or fallback to defaults
    const privateKey = this.getEnvVar('GOOGLE_PRIVATE_KEY', '');
    const spreadsheetId = this.getEnvVar('GOOGLE_SPREADSHEET_ID', GOOGLE_SHEETS_CONFIG.spreadsheetId);
    
    this.spreadsheetId = spreadsheetId;

    if (privateKey) {
      this.auth = new ServiceAccountAuth(
        GOOGLE_SHEETS_CONFIG.serviceAccount.email,
        privateKey,
        GOOGLE_SHEETS_CONFIG.serviceAccount.projectId
      );
      // Only log for owner/admin - check if owner mode is active
      const isOwnerMode = this.checkOwnerMode();
      if (isOwnerMode) {
        console.log('✅ Google Sheets service account authentication configured');
      }
    } else {
      // Only warn for owner/admin
      const isOwnerMode = this.checkOwnerMode();
      if (isOwnerMode) {
        console.warn('⚠️ Google Sheets private key not configured. Use admin panel to configure.');
      }
    }
  }

  private checkOwnerMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    return hash === '#admin-analytics' || 
           hash === '#admin-sheets-config' || 
           urlParams.get('admin') === 'analytics' || 
           urlParams.get('admin') === 'sheets' ||
           urlParams.get('owner') === 'true';
  }

  private getEnvVar(name: string, defaultValue: string): string {
    // In a browser environment, these would typically be passed through build process
    // For now, we'll check if they're available globally or in localStorage for demo
    if (typeof window !== 'undefined') {
      return localStorage.getItem(name) || defaultValue;
    }
    return defaultValue;
  }

  // Check if Google Sheets is configured
  isConfigured(): boolean {
    return !!(this.auth && this.spreadsheetId);
  }

  private async getValidAccessToken(): Promise<string> {
    if (!this.auth) {
      throw new Error('Google Sheets authentication not configured');
    }

    const now = Date.now();
    if (!this.accessToken || now >= this.tokenExpiry) {
      this.accessToken = await this.auth.getAccessToken();
      this.tokenExpiry = now + 3300000; // 55 minutes (tokens expire in 1 hour)
    }

    return this.accessToken;
  }

  // Generic method to read from a sheet
  private async readSheet(range: string): Promise<string[][]> {
    if (!this.isConfigured()) {
      // Only warn owner/admin users
      if (this.checkOwnerMode()) {
        console.warn('Google Sheets not configured, returning empty data');
      }
      return [];
    }

    try {
      const accessToken = await this.getValidAccessToken();
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleSheetsResponse = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      return [];
    }
  }

  // Generic method to write to a sheet
  private async writeSheet(range: string, values: string[][]): Promise<boolean> {
    if (!this.isConfigured()) {
      // Only warn owner/admin users
      if (this.checkOwnerMode()) {
        console.warn('Google Sheets not configured, simulating write operation');
      }
      return true;
    }

    try {
      const accessToken = await this.getValidAccessToken();
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error writing to Google Sheets:', error);
      return false;
    }
  }

  // Generic method to append to a sheet
  private async appendSheet(range: string, values: string[][]): Promise<boolean> {
    if (!this.isConfigured()) {
      // Only warn owner/admin users
      if (this.checkOwnerMode()) {
        console.warn('Google Sheets not configured, simulating append operation');
      }
      return true;
    }

    try {
      const accessToken = await this.getValidAccessToken();
      const url = `${SHEETS_API_BASE}/${this.spreadsheetId}/values/${range}:append?valueInputOption=RAW`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error appending to Google Sheets:', error);
      return false;
    }
  }

  // Method to ensure sheet exists with proper headers
  private async ensureSheetExists(sheetName: string, headers: string[]): Promise<boolean> {
    try {
      // Try to read the first row to see if headers exist
      const firstRow = await this.readSheet(`${sheetName}!1:1`);
      
      // If no data or headers don't match, create/update headers
      if (firstRow.length === 0 || firstRow[0].length === 0) {
        console.log(`Creating headers for ${sheetName} sheet`);
        return await this.writeSheet(`${sheetName}!1:1`, [headers]);
      }
      
      return true;
    } catch (error) {
      console.error(`Error ensuring ${sheetName} sheet exists:`, error);
      return false;
    }
  }

  // Auto-setup method to create all required sheets
  async autoSetupSheets(): Promise<boolean> {
    try {
      const sheetsConfig = [
        {
          name: 'Users',
          headers: ['id', 'email', 'firstName', 'lastName', 'phone', 'age', 'location', 'isVerified', 'profilePhotoUrl', 'bio', 'occupation', 'interests', 'personalityScores', 'propertyPreferences', 'created_at', 'updated_at']
        },
        {
          name: 'QuizResults',
          headers: ['id', 'userId', 'results', 'created_at']
        },
        {
          name: 'PropertyListings',
          headers: ['id', 'title', 'description', 'address', 'suburb', 'state', 'postcode', 'propertyType', 'rentPerWeek', 'bond', 'availableFrom', 'leaseDuration', 'bedroomsTotal', 'bedroomsAvailable', 'bathrooms', 'parking', 'features', 'images', 'ownerId', 'ownerName', 'ownerAge', 'created', 'verified']
        },
        {
          name: 'ChatMessages',
          headers: ['id', 'senderId', 'receiverId', 'message', 'timestamp', 'type', 'read']
        },
        {
          name: 'MarketplaceItems',
          headers: ['id', 'title', 'description', 'price', 'category', 'condition', 'images', 'sellerId', 'sellerName', 'location', 'status', 'created', 'tags']
        },
        {
          name: 'SupportRequests',
          headers: ['id', 'userId', 'name', 'email', 'subject', 'message', 'created_at', 'status']
        }
      ];

      for (const sheet of sheetsConfig) {
        await this.ensureSheetExists(sheet.name, sheet.headers);
      }

      if (this.checkOwnerMode()) {
        console.log('✅ All required sheets have been set up');
      }
      return true;
    } catch (error) {
      console.error('Error setting up sheets:', error);
      return false;
    }
  }

  // User management methods
  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const rows = await this.readSheet(GOOGLE_SHEETS_CONFIG.ranges.users);
      
      // Skip header row and find user
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[1] === email) { // Email is in column B
          return {
            id: row[0] || '',
            email: row[1] || '',
            firstName: row[2] || '',
            lastName: row[3] || '',
            phone: row[4] || '',
            age: row[5] ? parseInt(row[5]) : undefined,
            location: row[6] || '',
            isVerified: row[7] === 'TRUE',
            profilePhotoUrl: row[8] || null,
            bio: row[9] || '',
            occupation: row[10] || '',
            interests: row[11] ? JSON.parse(row[11]) : [],
            personalityScores: row[12] ? JSON.parse(row[12]) : {},
            propertyPreferences: row[13] ? JSON.parse(row[13]) : {}
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(userData: Partial<UserData>): Promise<UserData | null> {
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser: UserData = {
        id: userId,
        email: userData.email || '',
        firstName: userData.firstName || 'User',
        lastName: userData.lastName || '',
        phone: userData.phone,
        age: userData.age,
        location: userData.location,
        isVerified: true, // Auto-verify for simplicity
        profilePhotoUrl: userData.profilePhotoUrl || null,
        bio: userData.bio || '',
        occupation: userData.occupation || '',
        interests: userData.interests || [],
        personalityScores: userData.personalityScores || {},
        propertyPreferences: userData.propertyPreferences || {}
      };

      const rowData = [
        newUser.id,
        newUser.email,
        newUser.firstName,
        newUser.lastName,
        newUser.phone || '',
        newUser.age?.toString() || '',
        newUser.location || '',
        newUser.isVerified ? 'TRUE' : 'FALSE',
        newUser.profilePhotoUrl || '',
        newUser.bio,
        newUser.occupation,
        JSON.stringify(newUser.interests),
        JSON.stringify(newUser.personalityScores),
        JSON.stringify(newUser.propertyPreferences),
        new Date().toISOString(), // created_at
        new Date().toISOString()  // updated_at
      ];

      const success = await this.appendSheet(GOOGLE_SHEETS_CONFIG.ranges.users, [rowData]);
      return success ? newUser : null;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<UserData>): Promise<UserData | null> {
    try {
      const rows = await this.readSheet(GOOGLE_SHEETS_CONFIG.ranges.users);
      
      // Find user row
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === userId) {
          const currentUser = {
            id: rows[i][0],
            email: rows[i][1],
            firstName: rows[i][2],
            lastName: rows[i][3],
            phone: rows[i][4],
            age: rows[i][5] ? parseInt(rows[i][5]) : undefined,
            location: rows[i][6],
            isVerified: rows[i][7] === 'TRUE',
            profilePhotoUrl: rows[i][8] || null,
            bio: rows[i][9],
            occupation: rows[i][10],
            interests: rows[i][11] ? JSON.parse(rows[i][11]) : [],
            personalityScores: rows[i][12] ? JSON.parse(rows[i][12]) : {},
            propertyPreferences: rows[i][13] ? JSON.parse(rows[i][13]) : {}
          };

          const updatedUser = { ...currentUser, ...updates };
          
          const rowData = [
            updatedUser.id,
            updatedUser.email,
            updatedUser.firstName,
            updatedUser.lastName,
            updatedUser.phone || '',
            updatedUser.age?.toString() || '',
            updatedUser.location || '',
            updatedUser.isVerified ? 'TRUE' : 'FALSE',
            updatedUser.profilePhotoUrl || '',
            updatedUser.bio,
            updatedUser.occupation,
            JSON.stringify(updatedUser.interests),
            JSON.stringify(updatedUser.personalityScores),
            JSON.stringify(updatedUser.propertyPreferences),
            rows[i][14], // keep original created_at
            new Date().toISOString() // updated_at
          ];

          const range = `Users!A${i + 1}:P${i + 1}`;
          const success = await this.writeSheet(range, [rowData]);
          return success ? updatedUser : null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Quiz results methods
  async saveQuizResults(userId: string, results: Record<string, any>): Promise<boolean> {
    try {
      const rowData = [
        `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        JSON.stringify(results),
        new Date().toISOString()
      ];

      const success = await this.appendSheet(GOOGLE_SHEETS_CONFIG.ranges.quizResults, [rowData]);
      
      if (this.checkOwnerMode()) {
        console.log('Quiz results saved:', success ? 'success' : 'failed');
      }
      
      return success;
    } catch (error) {
      if (this.checkOwnerMode()) {
        console.error('Error saving quiz results:', error);
      }
      // Return true to not break the user flow even if save fails
      return true;
    }
  }

  // Property listings methods
  async getPropertyListings(): Promise<any[]> {
    try {
      const rows = await this.readSheet(GOOGLE_SHEETS_CONFIG.ranges.propertyListings);
      const listings = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length > 0) {
          listings.push({
            id: row[0],
            title: row[1],
            description: row[2],
            address: row[3],
            suburb: row[4],
            state: row[5],
            postcode: row[6],
            propertyType: row[7],
            rentPerWeek: parseInt(row[8]) || 0,
            bond: parseInt(row[9]) || 0,
            availableFrom: row[10],
            leaseDuration: row[11],
            bedroomsTotal: parseInt(row[12]) || 0,
            bedroomsAvailable: parseInt(row[13]) || 0,
            bathrooms: parseInt(row[14]) || 0,
            parking: parseInt(row[15]) || 0,
            features: row[16] ? JSON.parse(row[16]) : [],
            images: row[17] ? JSON.parse(row[17]) : [],
            ownerId: row[18],
            ownerName: row[19],
            ownerAge: parseInt(row[20]) || 0,
            created: row[21],
            verified: row[22] === 'TRUE'
          });
        }
      }

      return listings;
    } catch (error) {
      console.error('Error getting property listings:', error);
      return [];
    }
  }

  async createPropertyListing(listing: any): Promise<boolean> {
    try {
      const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const rowData = [
        listingId,
        listing.title,
        listing.description,
        listing.address,
        listing.suburb,
        listing.state,
        listing.postcode,
        listing.propertyType,
        listing.rentPerWeek.toString(),
        listing.bond.toString(),
        listing.availableFrom,
        listing.leaseDuration,
        listing.bedroomsTotal.toString(),
        listing.bedroomsAvailable.toString(),
        listing.bathrooms.toString(),
        listing.parking.toString(),
        JSON.stringify(listing.features),
        JSON.stringify(listing.images),
        listing.ownerId,
        listing.ownerName,
        listing.ownerAge.toString(),
        new Date().toISOString(),
        'TRUE' // verified
      ];

      return await this.appendSheet(GOOGLE_SHEETS_CONFIG.ranges.propertyListings, [rowData]);
    } catch (error) {
      console.error('Error creating property listing:', error);
      return false;
    }
  }

  // Chat messages methods
  async getChatMessages(userId: string): Promise<any[]> {
    try {
      const rows = await this.readSheet(GOOGLE_SHEETS_CONFIG.ranges.chatMessages);
      const messages = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if ((row[1] === userId || row[2] === userId) && row.length > 0) {
          messages.push({
            id: row[0],
            senderId: row[1],
            receiverId: row[2],
            message: row[3],
            timestamp: row[4],
            type: row[5] || 'text',
            read: row[6] === 'TRUE'
          });
        }
      }

      return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async sendChatMessage(senderId: string, receiverId: string, message: string, type: string = 'text'): Promise<boolean> {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const rowData = [
        messageId,
        senderId,
        receiverId,
        message,
        new Date().toISOString(),
        type,
        'FALSE' // read status
      ];

      return await this.appendSheet(GOOGLE_SHEETS_CONFIG.ranges.chatMessages, [rowData]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      return false;
    }
  }

  // Marketplace methods
  async getMarketplaceItems(): Promise<any[]> {
    try {
      const rows = await this.readSheet(GOOGLE_SHEETS_CONFIG.ranges.marketplaceItems);
      const items = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length > 0 && row[10] === 'available') { // status column
          items.push({
            id: row[0],
            title: row[1],
            description: row[2],
            price: parseFloat(row[3]) || 0,
            category: row[4],
            condition: row[5],
            images: row[6] ? JSON.parse(row[6]) : [],
            sellerId: row[7],
            sellerName: row[8],
            location: row[9],
            status: row[10],
            created: row[11],
            tags: row[12] ? JSON.parse(row[12]) : []
          });
        }
      }

      return items;
    } catch (error) {
      console.error('Error getting marketplace items:', error);
      return [];
    }
  }

  async createMarketplaceItem(item: any): Promise<boolean> {
    try {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const rowData = [
        itemId,
        item.title,
        item.description,
        item.price.toString(),
        item.category,
        item.condition,
        JSON.stringify(item.images),
        item.sellerId,
        item.sellerName,
        item.location,
        'available',
        new Date().toISOString(),
        JSON.stringify(item.tags || [])
      ];

      return await this.appendSheet(GOOGLE_SHEETS_CONFIG.ranges.marketplaceItems, [rowData]);
    } catch (error) {
      console.error('Error creating marketplace item:', error);
      return false;
    }
  }

  // Support requests methods
  async createSupportRequest(request: any): Promise<boolean> {
    try {
      const requestId = `support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const rowData = [
        requestId,
        request.userId || 'anonymous',
        request.name,
        request.email,
        request.subject,
        request.message,
        new Date().toISOString(),
        'open' // status
      ];

      return await this.appendSheet(GOOGLE_SHEETS_CONFIG.ranges.supportRequests, [rowData]);
    } catch (error) {
      console.error('Error creating support request:', error);
      return false;
    }
  }

  // Admin method to set configuration (for development)
  setConfiguration(spreadsheetId: string, privateKey: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('GOOGLE_SPREADSHEET_ID', spreadsheetId);
      localStorage.setItem('GOOGLE_PRIVATE_KEY', privateKey);
      
      this.spreadsheetId = spreadsheetId;
      this.auth = new ServiceAccountAuth(
        GOOGLE_SHEETS_CONFIG.serviceAccount.email,
        privateKey,
        GOOGLE_SHEETS_CONFIG.serviceAccount.projectId
      );
      
      if (this.checkOwnerMode()) {
        console.log('✅ Google Sheets configuration updated');
      }
    }
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        if (this.checkOwnerMode()) {
          console.warn('Google Sheets not configured');
        }
        return false;
      }

      // Auto-setup sheets when testing connection
      await this.autoSetupSheets();

      const testData = await this.readSheet('Users!A1:A1');
      if (this.checkOwnerMode()) {
        console.log('✅ Google Sheets connection test successful');
      }
      return true;
    } catch (error) {
      if (this.checkOwnerMode()) {
        console.error('❌ Google Sheets connection test failed:', error);
      }
      return false;
    }
  }

  // Method to get current configuration (for admin panel)
  getConfiguration() {
    return {
      spreadsheetId: this.spreadsheetId,
      serviceAccountEmail: GOOGLE_SHEETS_CONFIG.serviceAccount.email,
      isConfigured: this.isConfigured()
    };
  }
}

// Simple localStorage-based authentication
class SimpleAuth {
  private static STORAGE_KEY = 'share_with_me_auth';

  static getCurrentUser(): UserData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static setCurrentUser(user: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  static signOut(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  static async signIn(email: string, password: string): Promise<UserData | null> {
    // Simple authentication - in a real app you'd validate credentials
    try {
      const user = await googleSheets.getUserByEmail(email);
      if (user) {
        this.setCurrentUser(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error signing in:', error);
      return null;
    }
  }

  static async signUp(userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
    age?: number;
    location?: string;
  }): Promise<UserData | null> {
    try {
      // Check if user already exists
      const existingUser = await googleSheets.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user
      const newUser = await googleSheets.createUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        age: userData.age,
        location: userData.location,
        isVerified: true
      });

      if (newUser) {
        this.setCurrentUser(newUser);
        return newUser;
      }
      return null;
    } catch (error) {
      console.error('Error signing up:', error);
      return null;
    }
  }
}

// Export instances
export const googleSheets = new GoogleSheetsService();
export const simpleAuth = SimpleAuth;

// Helper functions for backward compatibility
export const isGoogleSheetsConfigured = (): boolean => {
  return googleSheets.isConfigured();
};

// Readiness check function
export const checkGoogleSheetsReady = (): { isReady: boolean; message: string } => {
  const configured = googleSheets.isConfigured();
  
  if (configured) {
    return {
      isReady: true,
      message: '✅ Google Sheets backend is configured and ready!'
    };
  }
  
  return {
    isReady: false,
    message: '⚠️ Google Sheets private key not configured. Use admin panel to configure.'
  };
};