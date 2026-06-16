import { useMemo } from "react";
import { assignAvatars } from "../assets/avatars.js";
import { getEveryone } from "../utils/room.js";

export default function useAvatarMap(currentRoom) {
  const playerIds = useMemo(() => {
    if (!currentRoom) return "";
    const everyone = getEveryone(currentRoom);
    return everyone.map((p) => p.id).join(",");
  }, [
    currentRoom?.admin?.id,
    currentRoom?.king?.id,
    (currentRoom?.aspirants || []).map((a) => a.id).join(","),
  ]);

  const everyone = useMemo(() => {
    if (!currentRoom) return [];
    return getEveryone(currentRoom);
  }, [playerIds]);

  const avatarMap = useMemo(
    () => assignAvatars(everyone),
    [everyone]
  );

  return { avatarMap, everyone };
}