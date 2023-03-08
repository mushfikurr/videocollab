import { Icon } from "./IconButton";
import { BsFillVolumeUpFill, BsFillTrashFill } from "react-icons/bs";

import { RiVolumeUpLine, RiCloseFill } from "react-icons/ri";

export function TrackHeading(props) {
  return (
    <div
      className={`flex hover:bg-gray-800 px-4 py-3 text-xs border-gray-800 border-b`}
    >
      <p className="flex flex-grow items-center justify-content capitalize">
        {props.name}
      </p>
    </div>
  );
}
