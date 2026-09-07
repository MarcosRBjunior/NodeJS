import { Router } from 'express';
import { obterConexao } from '#db/connection.js';
import { AuthService } from '#services/auth.service.js';
import { AuthController } from '#controllers/auth.controller.js';
import { autenticar } from '#middlewares/autenticar.js';

const db = obterConexao();

export default function criarAuthRoutes() {
  const router = Router();
  const authService = new AuthService(db);
  const authController = new AuthController(authService);

  router.post('/auth/registrar', authController.registrar);
  router.post('/auth/login', authController.login);
  router.get('/auth/me', autenticar, authController.me);

  return router;
}
