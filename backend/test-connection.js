/**
 * Database Connection Test Script
 * Run this to diagnose connection issues: node test-connection.js
 */

const sql = require('mssql');

// Test different connection configurations
const testConfigs = [
  {
    name: 'Format 1: IP with port, instance in options',
    config: {
      server: '103.98.12.218',
      port: 59320,
      database: 'mobileApp',
      user: 'Ikonuser',
      password: 'userikon',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 60000,
        instanceName: 'SQLEXPRESS',
      },
    },
  },
  {
    name: 'Format 2: IP with instance and port in server string',
    config: {
      server: '103.98.12.218\\SQLEXPRESS,59320',
      database: 'mobileApp',
      user: 'Ikonuser',
      password: 'userikon',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 60000,
      },
    },
  },
  {
    name: 'Format 3: IP with port only (no instance)',
    config: {
      server: '103.98.12.218',
      port: 59320,
      database: 'mobileApp',
      user: 'Ikonuser',
      password: 'userikon',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 60000,
      },
    },
  },
  {
    name: 'Format 4: Connection string',
    config: {
      connectionString: 'Server=103.98.12.218,59320;Database=mobileApp;User Id=Ikonuser;Password=userikon;Encrypt=false;TrustServerCertificate=true;Connection Timeout=60;',
    },
  },
];

async function testConnection() {
  console.log('========================================');
  console.log('🔍 Testing SQL Server Connection');
  console.log('========================================');
  console.log('Server: 103.98.12.218');
  console.log('Port: 59320');
  console.log('Instance: SQLEXPRESS');
  console.log('Database: mobileApp');
  console.log('User: Ikonuser');
  console.log('========================================\n');

  for (let i = 0; i < testConfigs.length; i++) {
    const test = testConfigs[i];
    console.log(`\n[${i + 1}/${testConfigs.length}] Testing: ${test.name}`);
    console.log('─'.repeat(50));

    try {
      let pool;
      if (test.config.connectionString) {
        pool = await sql.connect(test.config.connectionString);
      } else {
        pool = await sql.connect(test.config);
      }

      // Test query
      const result = await pool.request().query('SELECT @@VERSION AS Version, DB_NAME() AS DatabaseName');
      console.log('✅ Connection successful!');
      console.log(`   Database: ${result.recordset[0].DatabaseName}`);
      console.log(`   SQL Server Version: ${result.recordset[0].Version.split('\n')[0]}`);

      await pool.close();
      console.log('\n✅✅✅ SUCCESS! Use this configuration format.');
      return test.config;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.code) {
        console.log(`   Error Code: ${error.code}`);
      }
    }
  }

  console.log('\n❌❌❌ All connection attempts failed!');
  console.log('\n💡 Troubleshooting:');
  console.log('1. Verify SQL Server is running');
  console.log('2. Test connection in SSMS:');
  console.log('   Server: 103.98.12.218\\SQLEXPRESS,59320');
  console.log('   Login: Ikonuser / userikon');
  console.log('3. Check Windows Firewall allows port 59320');
  console.log('4. Verify SQL Server allows remote connections');
  console.log('5. Check if SQL Server Browser service is running');
  console.log('6. Ensure database "mobileApp" exists');
  process.exit(1);
}

testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

