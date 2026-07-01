import { GameProvider, useGame } from './ui/state/GameContext';
import StageSelect from './ui/screens/StageSelect';
import Briefing from './ui/screens/Briefing';
import AuctionRoom from './ui/screens/AuctionRoom';
import Review from './ui/screens/Review';
import Result from './ui/screens/Result';

// 화면 = 상태의 함수. 페이즈에 따라 화면을 전환한다.
function Screen() {
  const { state } = useGame();
  switch (state.phase) {
    case 'STAGE_SELECT':
      return <StageSelect />;
    case 'BRIEFING':
      return <Briefing />;
    case 'REVIEW':
      return <Review />;
    case 'RESULT':
      return <Result />;
    default:
      return <AuctionRoom />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Screen />
      </div>
    </GameProvider>
  );
}
