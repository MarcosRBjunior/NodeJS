const http = require('http');

const port = 8080;

const server = http.createServer((req, res) => { //req = request, res = response objeto da requisição  // res = resposta da requisição.
    if (req.url === '/home') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Home</h1>');
    }
    if (req.url === '/Users') {
        const users = [
            { name: 'Marcos', age: 30 },
            { name: 'Maria', age: 25 }
        ];
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(JSON.stringify(users));
    }
});

server.listen(port, () => console.log(`Servidor rodando na porta ${port}`)); //servidor ouvindo a porta 8080, e quando o servidor estiver rodando, ele vai imprimir a mensagem "Servidor rodando na porta 8080".
