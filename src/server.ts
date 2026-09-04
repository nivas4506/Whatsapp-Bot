import { app } from './app.js';
import { config } from './config/index.js';
import { db } from './store/db.js';

const PORT = config.PORT;

const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 WhatsApp Student Helpdesk Assistant (HOD) Started`);
  console.log(`📡 Port: ${PORT} | Environment: ${config.NODE_ENV}`);
  console.log(`🏢 Department: ${config.DEPARTMENT_NAME}`);
  console.log(`👤 HOD: ${config.HOD_DISPLAY_NAME}`);
  console.log(`=======================================================`);

  // Check database health on startup
  const isDbHealthy = await db.isHealthy();
  if (isDbHealthy) {
    console.log('✅ PostgreSQL database connection established.');
  } else {
    console.warn('⚠️ PostgreSQL database is not reachable at startup. Service running in degraded mode.');
  }
});

// Graceful Shutdown
function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await db.close();
      console.log('PostgreSQL connection pool closed.');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
