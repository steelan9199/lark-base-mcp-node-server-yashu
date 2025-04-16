// This shim provides a require function for ESM modules that need dynamic imports
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Make require available globally
globalThis.require = require; 