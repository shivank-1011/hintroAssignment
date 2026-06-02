type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
  traceId?: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

const log = (level: LogLevel, meta: LogMeta, message: string): void => {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta });

  switch (level) {
    case 'error': console.error(entry); break;
    case 'warn': console.warn(entry); break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') console.debug(entry);
      break;
    default: console.log(entry);
  }
};

export const logger = {
  info:  (meta: LogMeta, message: string) => log('info', meta, message),
  warn:  (meta: LogMeta, message: string) => log('warn', meta, message),
  error: (meta: LogMeta, message: string) => log('error', meta, message),
  debug: (meta: LogMeta, message: string) => log('debug', meta, message),
};
