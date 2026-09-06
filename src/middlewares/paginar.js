import { RequisicaoIncorreta } from '#erros/RequisicaoIncorreta.js';

const COLUNAS_ORDENACAO_PERMITIDAS_PADRAO = ['id'];

export function paginar({ colunasPermitidas = COLUNAS_ORDENACAO_PERMITIDAS_PADRAO } = {}) {
  return async function (req, res, next) {
    try {
      const { limite = 10, pagina = 1, ordenacao = 'id:asc' } = req.query;

      if (typeof ordenacao !== 'string') {
        return next(new RequisicaoIncorreta('O parâmetro "ordenacao" deve ser enviado uma única vez.'));
      }

      const [coluna, direcao = 'asc'] = ordenacao.split(':');

      const limiteNumerico = Number(limite);
      const paginaNumerica = Number(pagina);

      if (!Number.isInteger(limiteNumerico) || limiteNumerico <= 0) {
        return next(new RequisicaoIncorreta('O parâmetro "limite" deve ser um número inteiro positivo.'));
      }
      if (!Number.isInteger(paginaNumerica) || paginaNumerica <= 0) {
        return next(new RequisicaoIncorreta('O parâmetro "pagina" deve ser um número inteiro positivo.'));
      }
      if (!colunasPermitidas.includes(coluna)) {
        return next(new RequisicaoIncorreta(`Não é possível ordenar pela coluna "${coluna}".`));
      }
      if (!['asc', 'desc'].includes(direcao)) {
        return next(new RequisicaoIncorreta('A direção de ordenação deve ser "asc" ou "desc".'));
      }

      const resultado = await req.consultaPaginavel
        .clone()
        .orderBy(coluna, direcao)
        .limit(limiteNumerico)
        .offset((paginaNumerica - 1) * limiteNumerico);

      res.status(200).json(resultado);
    } catch (erro) {
      next(erro);
    }
  };
}
