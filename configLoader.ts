import devConfig from './config/dev.json';
import prodConfig from './config/prod.json';

// Use Vite's import.meta.env to access environment variables
const env = import.meta.env.VITE_APP_ENVIRONMENT || 'development';

const config = env === 'production' ? prodConfig : devConfig;

export default config;
