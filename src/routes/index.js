import criarAuthRoutes from './auth.routes.js';
import criarAutoresRoutes from './autores.routes.js';
import criarEditorasRoutes from './editoras.routes.js';
import criarLivrosRoutes from './livros.routes.js';
import criarVendasRoutes from './vendas.routes.js';

export default function rotasLivraria(app, { emailGateway, stockGateway } = {}) {
  app.use(criarAuthRoutes());
  app.use(criarAutoresRoutes());
  app.use(criarEditorasRoutes());
  app.use(criarLivrosRoutes());
  app.use(criarVendasRoutes({ emailGateway, stockGateway }));
}
