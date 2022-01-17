const Pool = require('pg').Pool
const pool = new Pool({
    user: 'root',
    host: 'localhost',
    database: 'my_project',
    password: 'root',
    port: 5432
})

module.exports = pool