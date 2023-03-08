import { useContext, useState, useEffect } from "react";
import { SocketContext } from "../utils/SocketProvider";
import axios from "axios";
import { API_URL } from "../utils/Constants";
import { RiArrowDownSLine, RiAddFill, RiFileUploadLine } from "react-icons/ri";
import { Icon } from "./IconButton";

export function FilesDisplay(props) {
  const { isConnectedToRoom, socket, username, roomCode, members } =
    useContext(SocketContext);
  const [loadedFiles, setLoadedFiles] = useState();
  const [currentUserViewing, setCurrentUserViewing] = useState(username);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadedFilesToUpload, setLoadedFilesToUpload] = useState();

  const loadFiles = () => {
    if (isConnectedToRoom) {
      axios
        .post(`${API_URL}/getfiles`, {
          roomCode: roomCode,
          username: username,
        })
        .then((resp) => {
          setLoadedFiles(resp.data.files);
          setIsLoaded(true);
        })
        .catch((err) => {
          console.log(err.response);
        });
    }
  };

  const isMP3 = (fileName) => {
    const fileNameExt = fileName.split(".")[1];
    return fileNameExt === "mp3";
  };

  const onClipAdd = (file, currentUser) => {
    if (isConnectedToRoom) {
      // Disallow the addition of audio if there are no video clips.
      if (isMP3(file.fileName) && props.timelineClips["video"].length === 0) {
        return;
      }
      const fileToAdd = { file: file, username: currentUser };
      const action = {
        roomCode: roomCode,
        username: username,
        type: "addVideoToTimeline",
        data: fileToAdd,
      };
      socket.current.emit("action", action);
    }
  };

  const uploadFiles = (userFilesLoaded) => {
    const formData = new FormData();
    formData.append("roomCode", roomCode);
    formData.append("username", username);
    userFilesLoaded.forEach((file) => {
      const t = new Blob([file.file], { type: file.mimeType });
      var filename = file.fileName.substring(0, file.fileName.lastIndexOf("."));
      formData.append("files", t, filename);
    });

    axios({
      method: "POST",
      url: `${API_URL}/upload_files`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((resp) => {
        setIsUploading(false);
        const action = {
          roomCode: roomCode,
          username: username,
          type: "fileSync",
        };
        socket.current.emit("actionClient", action);
      })
      .catch((resp) => {
        setIsUploading(false);
      });
  };

  useEffect(() => {
    console.log(loadedFilesToUpload);
    if (loadedFilesToUpload && loadedFilesToUpload.length > 0) {
      window.api.getAllFilesWithoutObj(loadedFilesToUpload).then((result) => {
        uploadFiles(result);
      });
    }
  }, [loadedFilesToUpload]);

  const selectIndivFiles = () => {
    if (isConnectedToRoom) {
      window.api
        .selectDirectory(["openFIle", "multiSelections"])
        .then((result) => {
          if (result.canceled) return;
          setIsUploading(true);
          setLoadedFilesToUpload(result.filePaths);
        });
    }
  };

  useEffect(() => {
    if (isConnectedToRoom) {
      loadFiles();
      socket.current.on("fileSync", () => {
        loadFiles();
      });
    }
  }, [isConnectedToRoom]);

  return (
    <div className="w-2/6 h-4/6 border-r border-gray-800">
      <div className="flex h-16 justify-between items-center border-b border-gray-800 px-4">
        <span>
          <p className="font-medium">
            {isConnectedToRoom ? roomCode : "Disconnected"}
          </p>
          <p className="text-xs">Editing as {username}</p>
        </span>
      </div>
      <div className="flex flex-col px-4">
        <div className="flex pt-3 mb-1">
          <button className="grow relative w-full focus:outline-none group hover:text-gray-300">
            <div className="flex justify-content items-center">
              <p className="flex font-medium mr-2 h-full">
                {currentUserViewing}'s Assets
              </p>
              <span className="pt-[1px] cursor-pointer">
                <RiArrowDownSLine className="h-5 w-5" />
              </span>
            </div>

            <div className="absolute z-10 flex-col items-start hidden w-full mt-2 py-1 bg-gray-800 shadow-lg group-focus:flex">
              {members.map((member) => {
                return (
                  <span
                    className="w-full px-4 py-2 text-left hover:bg-gray-900"
                    onClick={() => {
                      setCurrentUserViewing(member);
                    }}
                  >
                    {member}
                  </span>
                );
              })}
            </div>
          </button>
          {username === currentUserViewing && (
            <div className="flex justify-center items-center">
              {!isUploading && (
                <span
                  className="hover:text-gray-300 cursor-pointer"
                  onClick={selectIndivFiles}
                >
                  <RiFileUploadLine className="h-5 w-5" />
                </span>
              )}
            </div>
          )}
        </div>

        {!isLoaded && (
          <div className="flex justify-content text-center items-center px-3 py-2 w-full">
            <svg
              fill="none"
              className="w-10 h-10 animate-spin text-sky-500"
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
          </div>
        )}
        {isLoaded &&
          loadedFiles[currentUserViewing]?.map((item) => {
            const currentUser = currentUserViewing;
            return (
              <div className="flex items-center justify-content border-b border-gray-800 bg-gray-900 hover:bg-gray-800 px-3 py-2 text-sm">
                <p className="grow truncate">{item.fileName}</p>
                <p>{item.fileDuration}</p>
                <Icon
                  onClick={() => {
                    onClipAdd(item, currentUser);
                  }}
                >
                  <RiAddFill className="w-5 h-5" />
                </Icon>
              </div>
            );
          })}
      </div>
    </div>
  );
}
