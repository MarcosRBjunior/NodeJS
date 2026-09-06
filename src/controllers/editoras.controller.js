import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { asyncHandler } from '#middlewares/asyncHandler.js';
import { validarObrigatorios } from '#utils/validarCampos.js';

export class EditorasController {
  constructor(editorasService) {
    this.editorasService = editorasService;
  }

  listarEditoras = (req, res, next) => {
    req.consultaPaginavel = this.editorasService.consultarEditoras();
    next();
  };

  buscarEditoraPorId = asyncHandler(async (req, res) => {
    const editora = await this.editorasService.buscarEditoraPorId(req.params.id);
    if (!editora) throw new NaoEncontrado('Editora não encontrada');
    res.status(200).send(editora);
  });

  cadastrarEditora = asyncHandler(async (req, res) => {
    const { nome, cidade, email } = req.body ?? {};
    validarObrigatorios({ nome, cidade, email }, ['nome', 'cidade', 'email']);

    const editora = await this.editorasService.cadastrarEditora({ nome, cidade, email });
    res.status(201).send(editora);
  });
}
