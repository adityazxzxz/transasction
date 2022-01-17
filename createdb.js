const pgp = require('pg-promise')(/* initialization options */);

const db = pgp({
    host: 'localhost',
    database: 'example',
    port: 5432,
    user: 'root', // any admin user
    password: 'root'
});

async function create() {
    await db.none('CREATE DATABASE $1:name', ['my_project']);
}

create()