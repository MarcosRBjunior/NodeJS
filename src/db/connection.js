import knex from 'knex';
import { databaseConfig } from '#config/database.config.js';

let conexaoSingleton;

export function criarConexao(config = databaseConfig) {
  return knex(config);
}

export function obterConexao() {
  if (!conexaoSingleton) {
    conexaoSingleton = criarConexao();
  }
  return conexaoSingleton;
}
