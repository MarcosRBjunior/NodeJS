import express from 'express';
import cors from 'cors';
import rotasLivraria from '#routes/index.js';
import { manipulador404 } from '#middlewares/manipulador404.js';
import { manipuladorDeErros } from '#middlewares/manipuladorDeErros.js';

export function criarApp({ emailGateway, stockGateway } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.status(200).json({
      projeto: 'bordeless',
      rotas: ['/auth/registrar', '/auth/login', '/auth/me', '/autores', '/editoras', '/livros', '/livros/busca', '/vendas'],
    });
  });

  rotasLivraria(app, { emailGateway, stockGateway });

  app.use(manipulador404);
  app.use(manipuladorDeErros);

  return app;
}
