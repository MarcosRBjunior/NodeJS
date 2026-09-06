-- Cria o banco de testes como cópia exata da estrutura do banco de produção/dev,
-- garantindo que ambos tenham sempre o mesmo schema.
-- Precisa trocar a conexão para "postgres" antes: não é possível usar um banco
-- como TEMPLATE enquanto a própria sessão está conectada nele.
\c postgres

CREATE DATABASE test WITH TEMPLATE bordeless OWNER postgres;
