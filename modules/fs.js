const fs = require('fs');
const path = require('path');

 // Criar pasta
//fs.mkdir(path.join(__dirname, 'test'), (err) => {
//    if (err) {
//        return console.log('Erro: ', err);
//    }
//    console.log('Pasta criada com sucesso!');
//});


// Criar arquivo

fs.writeFile(path.join(__dirname, '/test', 'test.txt'), 'Hello Node!', (err) => {
    if (err) {
        return console.log('Erro: ', err);
    }
    console.log('Arquivo criado com sucesso!');
 
    
    // Adicionar a um arquivo

    fs.appendFile(path.join(__dirname, '/test', 'test.txt'), '\nHello World!', (err) => {
        if (err) {
            return console.log('Erro: ', err);
        }
        console.log('Arquivo atualizado com sucesso!');
        
    });

    // Ler arquivo
    fs.readFile(path.join(__dirname, '/test', 'test.txt'), 'utf-8', (err, data) => {
        if (err) {
            return console.log('Erro: ', err);
        }
        console.log(data);
        
    });




});




