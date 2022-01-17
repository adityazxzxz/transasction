const Pool = require('pg').Pool
const pool = new Pool({
    user: 'example',
    host: 'localhost',
    database: 'project',
    password: 'example',
    port: 5432
})

module.exports = pool