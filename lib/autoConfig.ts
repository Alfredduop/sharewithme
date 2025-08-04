// Auto-configuration for development/testing
// IMPORTANT: Remove this file in production and use the admin panel instead

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDSCTPXsBfqONdw
yYOvFi0pFvKP1aR9YLTcG5kR6j2b6m9xMJUon33vlDziBgzB5nHjM0LCtqCPskX4
NHNfF1Dv2UV//3OtL30TwyxecquU8s24hR8+MaSGFHLDdTV3KQFS9bKQY03oK8qA
Hr9zgmQqZcl/1KyBRVlT8o9Rz5iS7n9toFDXjg7OdwKpzQQfh5Jp4ki+mEqKoZ83
bGGe8lvGB55qptXxB5H0FEUa0pOFooq9cOhFdAFdVFgqz37jybaqjNu3uUJEmXpN
Ty8z7bzauSw2sqWFlk/IWNldgZTRyEU82K12scnFEvTMXeF4d4QGwi6tyvDHmDY1
XwWdplCzAgMBAAECggEAC7ZhqRxzwo1XtKPRvEWQHSN5DhZLoIY9CUbGTjgLjKwR
4A3MGfWftmiqZuKpew9lUgmKWbgioGcmybfuQXykxP51U4IkqqEXgeIEKy9ZbB2I
fuRFh4u8vffAv2LED+U+FdwHqhxivGV8wSpClafNLop6JkiIzU8KgGKDvxWRgr5a
HZUwpRotfKsmsGbndFYSaljzBd3yBMydkoC4LD8JLbClh0erE1gAykCQ9u6jVNW5
DLeskbrYfJkF+T9ZzZIuIiMKvXEmg0vunv7v54iDwA3OjF1ALzSEAlkuVNuvW4bF
ANXa3o0vRfWRaN18YUFCsTnxAmyVuHwASdu9xXmAyQKBgQDxczjyQHuFocVhZytC
a1mPfLWoNyR0j/ulZq6kVDQLLc6juHxKqNjlRft+zOjU3ALYTNN617lOXcpElmn8
jjyjuPICO4wuwxA3XzEz4P1M46PmoWSqEXV2fbsSdhTsKnyZtsL6IqBPoJboW6wn
BYvFpXcwsLy3lOd+WR0jfk4XvwKBgQDesV0Vm18vEx+YaM8S/+EoSgFd97qQphVJ
BKekCOk5lPFKRsSK0ZzEiOdqySurj+0YTUmoOiwiimyaHDnr2NZoXfGmBXqt53Cc
LV/AHSeLvBO7B2Znogf+mE0Pro7JEjyvPGrfVSEVDVoB0YlyeJP2W11M5M4azlgR
A6L7k7fkDQKBgF5CfjvMwqwzsGvLLA88+3TR2dU22cuLnlE/GfTbTooCswYlcphu
/GXdgUZKVqcq0Q2CSJlPeG9InDtUgUHwgWnlPM10U9C5pC4JwpqfPiPzRrw1y6e9
Mx80DIEzig18tLIJsGqYc/9CEUfa6gU93AgoBbUDelktD4a64W5G09PfAoGAYJ8N
5zkRlGg0tjkLV5AEDioF69J3dRlKdPL7FZX0M1KnWnXYAu8tmKxZ1CBSvU5mLbwi
8EXFLntm4XrLusPLS18vYLxR3TBk0K5zM/SyWtOQr/5m9SH9W/6SuPIg66bpA5Mw
P5Q9FVhErDNQ8oTUlfhQQ/OmZUUQOtmcFpGiIOUCgYBPjIS6cNmX1N7p7+FfhKo1
pi54rVPW77j5imNBw60D758TAhgqQvIgI6sXVa1JkaLB64ZLG7yt9kUdl93eXW1G
hVDBnT/tw0zjUtVpnnOtcg4g63OLOhK74gFdI3niyIO5HSuWz/TrravSLnUh451N
k1pf2iYwmNZOShXmY87YSA==
-----END PRIVATE KEY-----`;

const SPREADSHEET_ID = '1Laofhk3_VgUiHsIcKeUfFmGFAieBfE9ZSQHGko-V3yY';

export function autoConfigureGoogleSheets() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('GOOGLE_SPREADSHEET_ID', SPREADSHEET_ID);
      localStorage.setItem('GOOGLE_PRIVATE_KEY', PRIVATE_KEY);
      
      // Force reload the GoogleSheets service to pick up new configuration
      const { googleSheets } = require('./googleSheets');
      googleSheets.setConfiguration(SPREADSHEET_ID, PRIVATE_KEY);
      
      console.log('✅ Google Sheets auto-configured successfully!');
      return true;
    } catch (error) {
      console.error('Error auto-configuring Google Sheets:', error);
      return false;
    }
  }
  return false;
}

export function clearAutoConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('GOOGLE_SPREADSHEET_ID');
    localStorage.removeItem('GOOGLE_PRIVATE_KEY');
    console.log('🧹 Auto-configuration cleared');
  }
}

// Auto-configure on import (for development only)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Only auto-configure on localhost for safety
  autoConfigureGoogleSheets();
}