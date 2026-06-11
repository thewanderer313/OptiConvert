import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

export interface SharedRx {
  sphere: number;
  cylinder: number;
  axis: number;
}

export interface SharedValues {
  patientPd: number | null;
  vertexDistance: number | null;
  refractiveIndex: number | null;
  workingDistance: number | null;
  lastRx: SharedRx | null;
}

type SharedKey = keyof SharedValues;

const EMPTY: SharedValues = {
  patientPd: null,
  vertexDistance: null,
  refractiveIndex: null,
  workingDistance: null,
  lastRx: null,
};

interface ContextShape {
  values: SharedValues;
  setValue: <K extends SharedKey>(key: K, value: SharedValues[K]) => void;
}

const SharedValuesContext = createContext<ContextShape | null>(null);

export function SharedValuesProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<SharedValues>(EMPTY);

  const setValue = useCallback(<K extends SharedKey>(key: K, value: SharedValues[K]) => {
    setValues((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const ctx = useMemo(() => ({ values, setValue }), [values, setValue]);

  return <SharedValuesContext.Provider value={ctx}>{children}</SharedValuesContext.Provider>;
}

export function useSharedValues(): ContextShape {
  const ctx = useContext(SharedValuesContext);
  if (!ctx) throw new Error('useSharedValues must be used inside SharedValuesProvider');
  return ctx;
}
