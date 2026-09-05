import { useState, useEffect } from 'react';
import { Edition, EditionSummary } from '../types';

export function useEditions() {
  const [editions, setEditions] = useState<EditionSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentEdition, setCurrentEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load manifest of editions
  useEffect(() => {
    async function loadEditions() {
      try {
        setLoading(true);
        const res = await fetch('./data/editions.json');
        if (!res.ok) {
          throw new Error(`Failed to load editions manifest (${res.status})`);
        }
        const data: EditionSummary[] = await res.json();
        setEditions(data);
        if (data.length > 0) {
          setSelectedYear(data[0].year);
        }
      } catch (err: any) {
        console.error('Error loading editions:', err);
        setError(err.message || 'Erro ao carregar lista de edições.');
      } finally {
        setLoading(false);
      }
    }
    loadEditions();
  }, []);

  // Load selected year's full nominees data
  useEffect(() => {
    if (!selectedYear) return;

    async function loadNominees() {
      try {
        setLoading(true);
        const res = await fetch(`./data/${selectedYear}/nominees.json`);
        if (!res.ok) {
          throw new Error(`Edição ${selectedYear} não encontrada (${res.status})`);
        }
        const data: Edition = await res.json();
        setCurrentEdition(data);
        setError(null);
      } catch (err: any) {
        console.error(`Error loading nominees for ${selectedYear}:`, err);
        setError(err.message || `Erro ao carregar dados de ${selectedYear}`);
      } finally {
        setLoading(false);
      }
    }
    loadNominees();
  }, [selectedYear]);

  return {
    editions,
    selectedYear,
    setSelectedYear,
    currentEdition,
    loading,
    error
  };
}
