require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

async function clearAll() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log('✅ Connected\n');

  const collections = ['recruiters', 'candidates', 'tasks', 'issues', 'reports', 'audits', 'updates', 'processmonitors'];
  
  for (const col of collections) {
    try {
      const result = await mongoose.connection.collection(col).deleteMany({});
      console.log(`🗑️  Cleared ${col}: ${result.deletedCount} documents deleted`);
    } catch (e) {
      console.log(`⚠️  ${col}: ${e.message}`);
    }
  }

  console.log('\n✅ All data cleared! Database is now empty.');
  await mongoose.disconnect();
  process.exit(0);
}

clearAll().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
