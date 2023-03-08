import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../utils/Constants";
import { SocketContext } from "../utils/SocketProvider";

export function CreateRoomLoading(props) {
  const [statusString, setStatusString] = useState("");
  const navigate = useNavigate();
  const { setRoomCode } = useContext(SocketContext);
  const errorStatusMessage = (action, resp) =>
    `There was an error ${action}: ${resp.response.data.message}. Returning back to file selection...`;

  useEffect(() => {
    createRoom();
  }, []);

  const createRoom = () => {
    axios
      .post(`${API_URL}/create`, {
        roomCode: props.roomCode,
      })
      .then((resp) => {
        setStatusString("Created a room. Uploading files...");
        setRoomCode(props.roomCode);
        setTimeout(() => uploadFilesToRoom(), 1000);
      })
      .catch((resp) => {
        setStatusString(errorStatusMessage("creating a room", resp));
        setTimeout(() => props.setHasSubmit(false), 1000);
      });
  };

  const uploadFilesToRoom = () => {
    const formData = new FormData();
    formData.append("roomCode", props.roomCode);
    formData.append("username", props.username);
    props.loadedFiles.forEach((file) => {
      const t = new Blob([file.file], { type: file.mimeType });
      var filename = file.fileName.substring(0, file.fileName.lastIndexOf("."));
      formData.append("files", t, filename);
    });

    setStatusString("Uploading files...");
    axios({
      method: "POST",
      url: `${API_URL}/upload_files`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((resp) => {
        setStatusString("Successfully uploaded files. Waiting to join room...");
        setTimeout(() => joinRoom(), 1000);
      })
      .catch((resp) => {
        setStatusString(errorStatusMessage("uploading", resp));
        setTimeout(() => props.setHasSubmit(false), 1000);
      });
  };

  const joinRoom = () => {
    axios
      .post(`${API_URL}/join`, {
        roomCode: props.roomCode,
        username: props.username,
      })
      .then((_) => {
        setStatusString("Joining room...");
        setTimeout(() => navigate("/newroom"), 3000);
      })
      .catch((resp) => {
        setStatusString(errorStatusMessage("joining", resp));
        setTimeout(() => props.setHasSubmit(false), 3000);
      });
  };

  return (
    <>
      <div className="flex items-center justify-center w-screen bg-gray-800 h-[calc(100vh-2rem)]">
        <div className="flex justify-center items-center space-x-1 text-lg text-gray-300">
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
          <div>{statusString}</div>
        </div>
      </div>
    </>
  );
}
