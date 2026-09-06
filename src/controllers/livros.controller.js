import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { asyncHandler } from '#middlewares/asyncHandler.js';
import { validarObrigatorios, validarNumeroPositivo } from '#utils/validarCampos.js';

export class LivrosController {
  constructor(livrosService) {
    this.livrosService = livrosService;
  }

  listarLivros = (req, res, next) => {
    req.consultaPaginavel = this.livrosService.consultarLivros();
    next();
  };

  buscarLivroPorFiltro = (req, res, next) => {
    const { titulo, autor_id, editora_id, minPaginas, maxPaginas } = req.query;
    req.consultaPaginavel = this.livrosService.consultarLivrosComFiltro({
      titulo,
      autor_id,
      editora_id,
      minPaginas,
      maxPaginas,
    });
    next();
  };

  buscarLivroPorId = asyncHandler(async (req, res) => {
    const livro = await this.livrosService.buscarLivroPorId(req.params.id);
    if (!livro) throw new NaoEncontrado('Livro não encontrado');
    res.status(200).send(livro);
  });

  cadastrarLivro = asyncHandler(async (req, res) => {
    const { titulo, paginas, autor_id, editora_id } = req.body ?? {};
    validarObrigatorios({ titulo, paginas, autor_id, editora_id }, ['titulo', 'paginas', 'autor_id', 'editora_id']);
    validarNumeroPositivo(paginas, 'paginas');

    const livro = await this.livrosService.cadastrarLivro({ titulo, paginas, autor_id, editora_id });
    res.status(201).send(livro);
  });
}
