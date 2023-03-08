import NavigationMenu from "../components/NavigationMenu";
import Submenu from "../components/Submenu";
import Titlebar from "../components/Titlebar";
import { useEffect, useContext, useState } from "react";
import { homeIcon, pageIcon } from "../components/Icons";
import { FaRegFileVideo } from "react-icons/fa";
import {
  RiLogoutBoxLine,
  RiSettings3Line,
  RiFolderTransferFill,
} from "react-icons/ri";
import PageContainer from "../components/PageContainer";
import { CreateRoomLoading } from "./LoadingPages";
import { SocketContext } from "../utils/SocketProvider";

function RenderFileThumbnail(props) {
  const [selected, setSelected] = useState(props.selected);
  const [currIndex, setCurrIndex] = useState();

  const onClickFile = () => {
    props.setSelectedFiles([
      ...props.selectedFiles,
      {
        fileName: props.file.fileName,
        dir: props.currDirectory,
        index: props.indexCounter,
      },
    ]);
    setCurrIndex(props.indexCounter);
    props.setIndexCounter(props.indexCounter + 1);
  };

  const onUnclickFile = () => {
    const filtered = props.selectedFiles.filter((e) => {
      return e.index !== currIndex;
    });
    props.setSelectedFiles(filtered);
  };

  useEffect(() => {
    if (
      props.selectedFiles.some((file) => {
        return (
          file["fileName"] === props.file.fileName &&
          file["dir"] === props.currDirectory
        );
      })
    ) {
      setSelected(true);
    } else {
      setSelected(false);
    }
  }, [props.selectedFiles, props.currDirectory]);

  if (selected) {
    return (
      <div
        className="cursor-pointer rounded mb-2 bg-gray-600 border-solid border border-sky-500"
        onClick={onUnclickFile}
      >
        <div className="py-4 px-4 flex w-full items-center">
          <FaRegFileVideo className="h-6 w-6 mr-2" />
          <p className="grow font-medium text-sm">{props.file.fileName}</p>
          <p className="flex text-xs">
            {(props.file.stat.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="cursor-pointer rounded hover:bg-gray-600 mb-2 bg-gray-700"
        onClick={onClickFile}
      >
        <div className="py-4 px-4 flex w-full items-center">
          <FaRegFileVideo className="h-6 w-6 mr-2" />
          <p className="grow font-medium text-sm truncate">
            {props.file.fileName}
          </p>
          <p className="flex text-xs">
            {(props.file.stat.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  }
}

const menuItems = [
  { icon: <RiLogoutBoxLine className="h-5 w-5" />, path: "" },
  { icon: <RiSettings3Line className="h-5 w-5" />, path: "" },
];

export default function ChooseFiles() {
  const [fileNames, setFileNames] = useState([]);
  const { username } = useContext(SocketContext);
  const [currDirectory, setCurrDirectory] = useState(__dirname);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [indexCounter, setIndexCounter] = useState(0);
  const [hasSubmit, setHasSubmit] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");

  const onCreateRoomClick = () => {
    window.api
      .getAllFiles(selectedFiles)
      .then((result) => {
        setLoadedFiles(result);
        if (selectedFiles.length > 0 && roomCodeInput.length > 0) {
          setHasSubmit(true);
        }
        setSelectedFiles([]);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const updateFilesInDirectory = () => {
    window.api
      .getFilesInDirectory(currDirectory)
      .then((result) => {
        setFileNames(result);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    updateFilesInDirectory();
  }, [currDirectory]);

  const onDirectorySubmission = () => {
    window.api
      .selectDirectory(["openFile", "openDirectory"])
      .then((result) => {
        if (!result.canceled) {
          setCurrDirectory(result.filePaths[0]);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  if (hasSubmit) {
    return (
      <>
        <PageContainer>
          <CreateRoomLoading
            roomCode={roomCodeInput}
            username={username}
            loadedFiles={loadedFiles}
            setHasSubmit={setHasSubmit}
          />
        </PageContainer>
      </>
    );
  } else {
    return (
      <>
        <PageContainer>
          <div className="flex h-[calc(100vh-2rem)] w-screen text-gray-400 bg-gray-900">
            <NavigationMenu menuItems={menuItems} />
            <Submenu
              title="Selected assets"
              setSelectedFiles={setSelectedFiles}
              selectedFiles={selectedFiles}
              currDirectory={currDirectory}
              menuItems={selectedFiles}
            />
            <div className="flex flex-col flex-grow">
              <div className="flex items-center flex-shrink-0 h-16 pl-8 pr-8 border-b border-gray-800">
                <h1 className="text-lg font-medium">
                  Create your room, {username}.
                </h1>
                <button
                  onClick={onDirectorySubmission}
                  className="flex items-center justify-center h-10 px-4 ml-auto text-sm font-medium rounded hover:bg-gray-800"
                >
                  Change Directory
                </button>
                <button
                  onClick={onCreateRoomClick}
                  className="flex items-center justify-center px-4 ml-2 flex-shrink-0 h-10 bg-sky-700 hover:bg-sky-600 text-sm text-gray-300 font-medium rounded"
                >
                  <RiFolderTransferFill className="mr-2 h-4 w-4" />
                  <span>Create Room</span>
                </button>
              </div>
              <div className="flex-grow overflow-auto px-8 py-6 bg-gray-800">
                {isLoading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  />
                )}
                {!isLoading && (
                  <>
                    {fileNames.length !== 0 && (
                      <>
                        <div>
                          <p className="font-medium text-gray-400">
                            Enter room name
                          </p>
                          <input
                            placeholder={"e.g. editingroom1"}
                            onChange={(e) => {
                              setRoomCodeInput(e.target.value);
                            }}
                            className="mt-2 mb-3 w-full py-3 px-3 rounded hover:bg-gray-600 border-none focus:outline-none text-gray-300 text-sm focus:ring-0 bg-gray-700"
                          ></input>
                        </div>
                        <p className="mt-3">
                          <span className="font-medium">
                            Choose your assets{" "}
                          </span>

                          <div className="text-sm text-gray-400">
                            Browsing{" "}
                            <span
                              className="cursor-pointer text-sky-600 hover:underline hover:text-sky-500 underline-offset-1"
                              onClick={onDirectorySubmission}
                            >
                              {currDirectory}
                            </span>
                          </div>
                        </p>
                        <div>
                          <div className="flex px-4 mt-2 mb-2 text-sm w-full font-medium text-gray-500">
                            <p className="grow">Name</p>
                            <p>Size</p>
                          </div>
                          <div>
                            {fileNames.map((file) => {
                              return (
                                <RenderFileThumbnail
                                  selectedFiles={selectedFiles}
                                  setSelectedFiles={setSelectedFiles}
                                  setIndexCounter={setIndexCounter}
                                  indexCounter={indexCounter}
                                  file={file}
                                  currDirectory={currDirectory}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                    {fileNames.length === 0 && (
                      <div className="flex w-full h-full text-center">
                        <p className="py-8 text-center w-full">
                          This directory does not include supported video
                          formats :(
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }
}
