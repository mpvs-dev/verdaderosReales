import "./styles/game.css";
import useGameRoom from "./hooks/useGameRoom";
import MenuScreen from "./components/MenuScreen";
import LobbyScreen from "./components/LobbyScreen";
import PlayingScreen from "./components/PlayingScreen";
import CreateQuestionScreen from "./components/CreateQuestionScreen";
import { KingPickScreen, KingRevealScreen } from "./components/KingScreens";
import {
  ResultsScreen,
  WaitingForQuestionScreen,
} from "./components/EndScreens";
import Toast from "./components/Toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { GAME_STATE, PLAYER_ROLE } from "./constants/game.js";
import InactivityModal from "./components/InactivityModal.jsx";
import EmptyRoomBanner from "./components/EmptyRoomBanner.jsx";

export default function App() {
  const room = useGameRoom();

  const effectiveRole =
    room.playerRole === PLAYER_ROLE.ADMIN_KING
      ? PLAYER_ROLE.KING
      : room.playerRole;

  const showEmptyBanner =
    room.emptyRoom &&
    (room.gameState === GAME_STATE.LOBBY ||
      room.gameState === GAME_STATE.PLAYING);

  const screens = {
    [GAME_STATE.MENU]: <MenuScreen {...room} />,
    [GAME_STATE.LOBBY]: <LobbyScreen {...room} />,
    [GAME_STATE.PICKING_KING]: <KingPickScreen {...room} />,
    [GAME_STATE.KING_REVEAL]: <KingRevealScreen {...room} />,
    [GAME_STATE.PLAYING]: (
      <PlayingScreen {...room} playerRole={effectiveRole} />
    ),
    [GAME_STATE.RESULTS]: <ResultsScreen {...room} />,
    [GAME_STATE.CREATING_QUESTION]: (
      <CreateQuestionScreen {...room} playerRole={effectiveRole} />
    ),
    [GAME_STATE.WAITING_QUESTION]: <WaitingForQuestionScreen {...room} />,
  };

  function handleInactivityClose() {
    room.resetTimer();
  }

  async function handleInactivityEndRoom() {
    await room.resetGame();
  }
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Toast toasts={room.toasts} onDismiss={room.dismiss} />
      <EmptyRoomBanner visible={showEmptyBanner} />
      <InactivityModal
        visible={room.inactive}
        onClose={handleInactivityClose}
        onEndRoom={handleInactivityEndRoom}
      />
      {screens[room.gameState] ?? null}
    </>
  );
}
