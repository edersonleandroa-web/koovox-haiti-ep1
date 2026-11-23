import React, { createContext, useContext } from "react";

/** Dados da cena atual: duração em quadros (sem a cauda da transição), índice e semente. */
export type SceneInfo = { dur: number; index: number; seed: number };

const Ctx = createContext<SceneInfo>({ dur: 150, index: 0, seed: 1 });

export const SceneProvider: React.FC<{ value: SceneInfo; children: React.ReactNode }> = ({ value, children }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

export const useScene = () => useContext(Ctx);
