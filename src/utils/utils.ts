import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

export const logToFile = (...args: any[]) => {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
  const logMessage = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ');

  const logEntry = `[${timestamp}] ${logMessage}\n`;
  const logFile = path.join(logDir, `base-service-${format(new Date(), 'yyyy-MM-dd')}.log`);

  fs.appendFileSync(logFile, logEntry);
  console.log(...args); // Also log to console for immediate feedback
};
