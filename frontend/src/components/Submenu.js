import { useEffect, useState } from "react";
import { RiDeleteBin7Line, RiCloseFill } from "react-icons/ri";
import { Icon } from "./IconButton";
import { Transition } from "@headlessui/react";

function MenuItem(props) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
    return () => {
      setIsLoaded(false);
    };
  }, []);

  const onDeleteClick = () => {
    const filtered = props.selectedFiles.filter((e) => {
      return e.index !== props.index;
    });
    props.setSelectedFiles(filtered);
  };

  return (
    <span className="cursor-pointer flex items-center flex-shrink-0 p-2 h-12 text-sm font-medium rounded hover:bg-gray-800">
      <span className="grow leading-none truncate">
        {props.value}
        <p className="text-xs font-normal truncate">{props.dir}</p>
      </span>
      <Icon styles={"hover:bg-gray-700"}>
        <RiCloseFill onClick={onDeleteClick} className="h-5 w-5" />
      </Icon>
    </span>
  );
}

export default function Submenu(props) {
  const clearCurrentItems = () => {
    props.setSelectedFiles([]);
  };

  return (
    <div className="flex flex-col w-56 border-r border-gray-800">
      <div className="relative text-sm focus:outline-none group">
        <div className="flex items-center justify-between border-b border-gray-800 w-full h-16 px-4">
          <span className="font-medium">{props.title}</span>
        </div>
      </div>
      {props.children}
      <div className="flex flex-col flex-grow p-4 overflow-auto">
        {props.menuItems.length === 0 && (
          <p className="text-center text-gray-500 pt-4 px-1 font-medium text-xs">
            You have not selected any videos.
          </p>
        )}
        {props.menuItems.map((menuItem) => {
          console.log("map menuItem", menuItem);
          return (
            <MenuItem
              dir={menuItem.dir}
              value={menuItem.fileName}
              index={menuItem.index}
              selectedFiles={props.selectedFiles}
              setSelectedFiles={props.setSelectedFiles}
            ></MenuItem>
          );
        })}
        {props.menuItems.length > 0 && (
          <button
            onClick={clearCurrentItems}
            className="flex items-center flex-shrink-0 h-10 px-3 mt-auto text-sm font-medium bg-gray-800 rounded hover:bg-gray-700"
          >
            <RiDeleteBin7Line className="h-4 w-4" />
            <span className="ml-2 leading-none">Clear All</span>
          </button>
        )}
      </div>
    </div>
  );
}
