const pgp = require('pg-promise')(/* initialization options */);

const db = pgp({
    database: 'example',
    port: 5432,
    user: 'example', // any admin user
    password: 'example'
});

async function create() {
    await db.none('CREATE DATABASE $1:name', ['project']);
}

create()