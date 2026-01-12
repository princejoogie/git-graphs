import { createContext, useContext, type ReactNode } from "react";

export function createSimpleContext<T>(name: string) {
  const Context = createContext<T | null>(null);

  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useCtx(): T {
    const value = useContext(Context);
    if (value === null) {
      throw new Error(`${name} context must be used within its Provider`);
    }
    return value;
  }

  return { Provider, use: useCtx };
}
