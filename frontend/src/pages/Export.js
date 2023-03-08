import Titlebar from "../components/Titlebar";
import { useState, useContext } from "react";
import { SocketContext } from "../utils/SocketProvider";
import { API_URL } from "../utils/Constants";

function LoadingOverlay(props) {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-black opacity-90 flex flex-col items-center justify-center">
      {!props.status && (
        <svg
          fill="none"
          className="w-20 h-20 animate-spin text-sky-500 mb-0"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clip-rule="evenodd"
            d="M15.165 8.53a.5.5 0 01-.404.58A7 7 0 1023 16a.5.5 0 011 0 8 8 0 11-9.416-7.874.5.5 0 01.58.404z"
            fill="currentColor"
            fill-rule="evenodd"
          />
        </svg>
      )}
      <h2 className="text-center text-white text-xl font-semibold">
        {props.status ? "Exported!" : "Exporting..."}
      </h2>
      <p className="w-1/3 text-center text-white">
        {props.status
          ? "Your file is now exported at " + props.status + "."
          : "This can take a few seconds. Please do not close the application."}
      </p>
      <button>Close</button>
    </div>
  );
}

export function Export(props) {
  const { roomCode } = useContext(SocketContext);
  const [currentPath, setCurrentPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(false);
  const [filename, setFilename] = useState("");

  const selectPath = () => {
    window.api
      .selectDirectory(["openFile", "openDirectory"])
      .then((result) => {
        if (!result.canceled) {
          setCurrentPath(result.filePaths[0]);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const exportRender = () => {
    setIsLoading(true);
    if (currentPath.length > 0) {
      const urlPathObj = {
        url: `${API_URL}/uploads/${roomCode}/preview/currentRender.mp4`,
        path: currentPath,
        filename: filename + ".mp4",
      };
      window.api.downloadFile(urlPathObj).then((result) => {
        setTimeout(() => setStatus(result), 2000);
        setTimeout(() => {
          setIsLoading(false);
          setStatus("");
        }, 3000);
      });
    }
  };

  return (
    <>
      <Titlebar
        setIsLoading={setIsLoading}
        status={status}
        setStatus={setStatus}
      />
      {isLoading && <LoadingOverlay status={status} />}
      <div className="flex h-[calc(100vh-2rem)] w-screen justify-center items-center text-gray-400 bg-gray-900">
        <div className="drop-shadow-lg w-2/6 bg-gray-800">
          <div className="bg-gray-800 pt-6 px-8 border-t-4 border-gray-700">
            <h1 className="text-xl pb-2 font-medium text-gray-400">
              Export your video
            </h1>
            <div className="pt-2 flex h-full">
              <span className="grow mb-1 w-full py-3 px-3 rounded hover:bg-gray-600 border-none focus:outline-none text-gray-400 text-sm focus:ring-0 bg-gray-700">
                {currentPath ? currentPath : "Change your path..."}
              </span>
              <button
                className="flex items-center justify-center h-11 ml-2 px-4 w-16 text-sm font-medium rounded hover:bg-gray-700"
                onClick={selectPath}
              >
                Change
              </button>
            </div>
            <div className="pt-2">
              <input
                placeholder="Enter your file name"
                className="mb-1 w-full py-3 px-3 rounded hover:bg-gray-600 border-none focus:outline-none text-gray-300 text-sm focus:ring-0 bg-gray-700"
                onChange={(e) => {
                  setFilename(e.target.value);
                }}
              ></input>
            </div>
          </div>
          <div className="pt-2 pb-5 px-8">
            <div className="flex mt-2">
              <div className="grow"></div>
              <button
                className="flex items-center justify-center h-10 w-16 px-4 text-sm font-medium rounded hover:bg-gray-700"
                onClick={() => {
                  props.setShowExport(false);
                }}
              >
                Back
              </button>
              <button
                onClick={exportRender}
                className="flex items-center justify-center px-4 ml-2 flex-shrink-0 h-10 bg-sky-700 hover:bg-sky-600 text-sm text-gray-300 font-medium rounded"
              >
                Export
              </button>
            </div>
          </div>
          <div></div>
        </div>
      </div>
    </>
  );
}
