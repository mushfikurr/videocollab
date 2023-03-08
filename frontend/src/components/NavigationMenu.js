import { homeIcon, pageIcon } from "./Icons";
import { useEffect, useRef } from "react";

function RenderIcon(props) {
  return (
    <div className="cursor-pointer flex items-center justify-center w-10 h-10 mt-4 rounded hover:bg-gray-800 hover:text-sky-500">
      {props.children}
    </div>
  );
}

export default function NavigationMenu(props) {
  return (
    <div className="flex flex-col items-center w-14 h-[calc(100vh-2rem)] border-r border-gray-800">
      <a
        className="flex items-center justify-center flex-shrink-0 w-full h-16"
        href="#"
      >
        <svg
          className="w-8 h-8 stroke-current text-gray-300"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </a>
      <div className="grow">
        {props.menuItems.map((item) => {
          return <RenderIcon>{item.icon}</RenderIcon>;
        })}
      </div>

      <div className="pb-4">{props.children}</div>
    </div>
  );
}
