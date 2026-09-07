import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function useLookups() {
  const [autoresPorId, setAutoresPorId] = useState({});
  const [editorasPorId, setEditorasPorId] = useState({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    Promise.all([api.listarAutores({ limite: 100 }), api.listarEditoras({ limite: 100 })])
      .then(([autores, editoras]) => {
        if (cancelado) return;
        setAutoresPorId(Object.fromEntries(autores.map((autor) => [autor.id, autor])));
        setEditorasPorId(Object.fromEntries(editoras.map((editora) => [editora.id, editora])));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return { autoresPorId, editorasPorId, carregando };
}
