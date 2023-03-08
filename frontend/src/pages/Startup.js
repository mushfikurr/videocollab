import Titlebar from "../components/Titlebar";
import { useNavigate } from "react-router-dom";
import JoinRoomModal from "../components/JoinRoomModal";
import { useState, useContext, useEffect } from "react";
import { SocketContext } from "../utils/SocketProvider";

export default function Startup() {
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false);
  const [inputUsername, setInputUsername] = useState("");
  const navigate = useNavigate();
  const { setUsername } = useContext(SocketContext);

  const toggleJoinDialog = () => {
    if (inputUsername) {
      setUsername(inputUsername);
      setJoinRoomModalOpen(!joinRoomModalOpen);
    }
  };

  const onCreate = () => {
    if (inputUsername) {
      setUsername(inputUsername);
      navigate("/choosefiles");
    }
  };

  return (
    <>
      <Titlebar />
      <JoinRoomModal
        isOpen={joinRoomModalOpen}
        setOpen={setJoinRoomModalOpen}
      />
      <div className="flex h-[calc(100vh-2rem)] w-screen justify-center items-center text-gray-400 bg-gray-900">
        <div className="drop-shadow-lg w-2/6 bg-gray-800">
          <div className="bg-gray-800 pt-6 px-8 border-t-4 border-gray-700">
            <h1 className="text-2xl pb-1 font-medium text-gray-300">
              Welcome to redacted
            </h1>
            <p className="text-sm">
              You can either join a room, or create your own to start editing.
            </p>
          </div>
          <div className="pb-5 pt-4 px-8">
            <div>
              <input
                placeholder="Enter your username"
                className="mb-1 w-full py-3 px-3 rounded hover:bg-gray-600 border-none focus:outline-none text-gray-300 text-sm focus:ring-0 bg-gray-700"
                onChange={(e) => {
                  setInputUsername(e.target.value);
                }}
              ></input>
            </div>
            <div className="flex mt-3">
              <div className="grow"></div>
              <button
                onClick={() => {
                  toggleJoinDialog();
                }}
                className="flex items-center justify-center h-10 w-16 px-4 text-sm font-medium rounded hover:bg-gray-700"
              >
                Join
              </button>
              <button
                onClick={onCreate}
                className="flex items-center justify-center h-10 w-16 px-4 text-sm font-medium rounded hover:bg-gray-700"
              >
                Create
              </button>
            </div>
          </div>
          <div></div>
        </div>
      </div>
    </>
  );
}
