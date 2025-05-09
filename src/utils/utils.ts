import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import axios from 'axios';
import pick from 'lodash.pick';
import get from 'lodash.get';


function _interopDefaultLegacy (e: any) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var get__default = /*#__PURE__*/_interopDefaultLegacy(get);

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

/**
 * Generate a simple UUID v4
 * @returns {string} A UUID v4 string
 */
export const uuid = () => {
  const hexDigits = '0123456789abcdef';
  let uuid = '';

  // Generate 32 hex digits and add hyphens at specific positions
  for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
          uuid += '-';
      } else if (i === 14) {
          // Version 4 UUID always has the third segment starting with '4'
          uuid += '4';
      } else if (i === 19) {
          // RFC 4122 variant: high bits of clock_seq_hi_and_reserved should be '10'
          uuid += hexDigits[(Math.random() * 4 | 0) + 8];
      } else {
          uuid += hexDigits[Math.random() * 16 | 0];
      }
  }

  return uuid;
}


export const formatErrors = (e: any) => {
  if (e instanceof axios.AxiosError) {
      const { message, response, request, config } = pick(e, [
          'message',
          'response',
          'request',
          'config',
      ]);
      const filteredErrorInfo = {
          message,
          config: pick(config, ['data', 'url', 'params', 'method']),
          request: pick(request, ['protocol', 'host', 'path', 'method']),
          response: pick(response, ['data', 'status', 'statusText']),
      };
      const errors = [filteredErrorInfo];
      const specificError = get__default["default"](e, 'response.data');
      if (specificError) {
          errors.push(Object.assign(Object.assign({}, specificError), (specificError.error ? specificError.error : {})));
      }
      return errors;
  }
  return [e];
};