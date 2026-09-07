import jwt from 'jsonwebtoken';
import { authConfig } from '#config/auth.config.js';

export function gerarToken(cliente) {
  return jwt.sign({ papel: cliente.papel }, authConfig.jwtSecret, {
    subject: String(cliente.id),
    expiresIn: authConfig.jwtExpiraEm,
  });
}

export function verificarToken(token) {
  const payload = jwt.verify(token, authConfig.jwtSecret);
  return { id: Number(payload.sub), papel: payload.papel };
}
