// const { Person } = require('./person');
const dotenv = require('dotenv');
const connectToDatabase = require('./src/database/connect');

dotenv.config();

(async () => {
    try {
        await connectToDatabase();
        console.log('Banco de dados conectado. Iniciando servidor Express...');
        require('./modules/express');
    } catch (error) {
        console.error('Falha ao iniciar aplicação:', error);
        process.exit(1);
    }
})();

// require('./modules/path');
// require('./modules/fs');
//require('./modules/http');

// const person = new Person("Marcos");

