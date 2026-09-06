import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { asyncHandler } from '#middlewares/asyncHandler.js';
import { validarObrigatorios, validarNumeroPositivo } from '#utils/validarCampos.js';

export class VendasController {
  constructor(vendasService) {
    this.vendasService = vendasService;
  }

  listarVendas = (req, res, next) => {
    req.consultaPaginavel = this.vendasService.consultarVendas();
    next();
  };

  buscarVendaPorId = asyncHandler(async (req, res) => {
    const venda = await this.vendasService.buscarVendaPorId(req.params.id);
    if (!venda) throw new NaoEncontrado('Venda não encontrada');
    res.status(200).send(venda);
  });

  cadastrarVenda = asyncHandler(async (req, res) => {
    const { idLivro, valor, modoPagamento } = req.body ?? {};
    validarObrigatorios({ idLivro, valor, modoPagamento }, ['idLivro', 'valor', 'modoPagamento']);
    validarNumeroPositivo(valor, 'valor');

    const venda = await this.vendasService.registrarVenda({ idLivro, valor, modoPagamento });
    res.status(201).send(venda);
  });
}
