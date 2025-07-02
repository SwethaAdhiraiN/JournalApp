Explanation: Create a central config file for the API base URL so that API endpoints are easier to manage.
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
