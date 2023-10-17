const Pool = require("pg").Pool;
const pool = new Pool({
    user: "postgres",
    password: "123321",
    host: "localhost",
    port: 5432,
    database: "nodejs"
});

module.exports = pool;