-- Executado automaticamente pelo Postgres na primeira subida do container
-- (docker-entrypoint-initdb.d), dentro do banco definido em POSTGRES_DB (bordeless).

CREATE TABLE IF NOT EXISTS autores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nacionalidade VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS editoras (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS livros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    paginas INTEGER NOT NULL,
    autor_id INTEGER NOT NULL REFERENCES autores(id),
    editora_id INTEGER NOT NULL REFERENCES editoras(id),
    preco NUMERIC(10, 2) NOT NULL DEFAULT 0,
    capa_url VARCHAR(500),
    categoria VARCHAR(50)
);

DO $$ BEGIN
    CREATE TYPE tipo_pagamento AS ENUM ('CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'BOLETO', 'DINHEIRO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    livro_id INTEGER NOT NULL REFERENCES livros(id),
    valor NUMERIC(10, 2) NOT NULL,
    tipo_pagamento tipo_pagamento NOT NULL
);
