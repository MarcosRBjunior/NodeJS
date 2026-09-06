import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { asyncHandler } from '#middlewares/asyncHandler.js';
import { validarObrigatorios } from '#utils/validarCampos.js';

export class AutoresController {
  constructor(autoresService) {
    this.autoresService = autoresService;
  }

  listarAutores = (req, res, next) => {
    req.consultaPaginavel = this.autoresService.consultarAutores();
    next();
  };

  buscarAutorPorId = asyncHandler(async (req, res) => {
    const autor = await this.autoresService.buscarAutorPorId(req.params.id);
    if (!autor) throw new NaoEncontrado('Autor não encontrado');
    res.status(200).send(autor);
  });

  cadastrarAutor = asyncHandler(async (req, res) => {
    const { nome, nacionalidade } = req.body ?? {};
    validarObrigatorios({ nome, nacionalidade }, ['nome', 'nacionalidade']);

    const autor = await this.autoresService.cadastrarAutor({ nome, nacionalidade });
    res.status(201).send(autor);
  });
}
