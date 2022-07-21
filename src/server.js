import pino from 'pino-http';

const logger = pino().logger;
const { app } = require('./app');
const { SERVER_PORT } = require('./environment');

const PORT = SERVER_PORT || 5000;
const env = process.env.ENVIRONMENT;

app.use(pino());

app.listen(PORT, () => {
  logger.info('=================================');
  logger.info(`======= ENV: ${env} =======`);
  logger.info(`🚀 App listening on the port ${PORT}`);
  logger.info('=================================');
});
