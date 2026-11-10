import React from "react";
import { type GameId, type Player } from "./model";
import Archery from "./games/Archery";
import Tower from "./games/Tower";
import Price from "./games/Price";
import Flight from "./games/Flight";
import Pool from "./games/Pool";
export default function Game(props: {
  id: GameId;
  player: Player;
  onDone: (n: number) => void;
  round: number;
  itemId?: string;
}) {
  switch (props.id) {
    case "archery":
      return <Archery {...props} />;
    case "tower":
      return <Tower {...props} />;
    case "price":
      return <Price {...props} />;
    case "flappy":
      return <Flight {...props} />;
    case "pool":
      return <Pool {...props} />;
    default:
      throw Error("Shared-screen game is rendered by the session controller.");
  }
}
