require('dotenv').config();

const app = require('./app');
const { initDbSeed } = require('./services/dbSeedService');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`CampConnect API running on port ${PORT}`);
  await initDbSeed();
});