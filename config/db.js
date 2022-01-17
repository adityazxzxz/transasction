const Pool = require('pg').Pool
const pool = new Pool({
    user: process.env.DB_USER || 'root',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'my_project',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432
})

module.exports = pool