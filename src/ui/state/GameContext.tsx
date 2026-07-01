import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { gameReducer, initialState, type GameAction, type GameState } from './gameReducer';

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (value === null) throw new Error('useGame은 GameProvider 안에서만 사용할 수 있다');
  return value;
}
