import { config } from 'dotenv';
config();

// Import flows so that they are registered with Genkit.
import './flows/generate-image';
