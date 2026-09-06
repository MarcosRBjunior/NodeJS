import { Router } from 'express';
import { obterConexao } from '#db/connection.js';
import { EditorasService } from '#services/editoras.service.js';
import { EditorasController } from '#controllers/editoras.controller.js';
import { paginar } from '#middlewares/paginar.js';

const db = obterConexao();

export default function criarEditorasRoutes() {
  const router = Router();
  const editorasService = new EditorasService(db);
  const editorasController = new EditorasController(editorasService);

  router.get('/editoras', editorasController.listarEditoras, paginar({ colunasPermitidas: ['id', 'nome'] }));
  router.get('/editoras/:id', editorasController.buscarEditoraPorId);
  router.post('/editoras', editorasController.cadastrarEditora);

  return router;
}
