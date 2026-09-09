import { NaoEncontrado } from '#erros/NaoEncontrado.js';
import { asyncHandler } from '#middlewares/asyncHandler.js';
import { validarObrigatorios, validarNumeroPositivo, validarInteiroPositivo } from '#utils/validarCampos.js';

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
    const { idLivro, valor, modoPagamento, quantidade } = req.body ?? {};
    validarObrigatorios({ idLivro, valor, modoPagamento, quantidade }, ['idLivro', 'valor', 'modoPagamento', 'quantidade']);
    validarNumeroPositivo(valor, 'valor');
    validarInteiroPositivo(quantidade, 'quantidade');

    const venda = await this.vendasService.registrarVenda({ idLivro, valor, modoPagamento, quantidade, clienteId: req.cliente.id });
    res.status(201).send(venda);
  });
}
