import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketContext } from "../utils/SocketProvider";
import { API_URL } from "../utils/Constants";

export default function JoinRoomModal(props) {
  const [loaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState();
  const { setRoomCode, username } = useContext(SocketContext);

  const navigate = useNavigate();

  const onJoin = () => {
    axios
      .post(`${API_URL}/join`, {
        roomCode: inputRoomCode,
        username: username,
      })
      .then(function (response) {
        setRoomCode(inputRoomCode);
        navigate("/newroom");
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  function closeModal() {
    setIsOpen(false);
    props.setOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      if (!props.isOpen) {
        closeModal();
      } else {
        openModal();
      }
    }
  }, [props.isOpen]);

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={closeModal}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl bg-gray-800 text-gray-400">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-300"
                >
                  Join room as {username}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm">
                    Enter your unique room code, case sensitive:
                  </p>
                </div>

                <input
                  onChange={(e) => {
                    setInputRoomCode(e.target.value);
                  }}
                  placeholder=""
                  className="mt-3 mb-1 w-full py-3 px-3 rounded hover:bg-gray-600 border-none focus:outline-none text-gray-300 text-sm focus:ring-0 bg-gray-700"
                ></input>

                <div className="flex flex-row-reverse mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center w-24 py-2 text-sm text-gray-300 font-medium bg-gray-700 rounded hover:bg-gray-600"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center w-24 py-2 mr-2 text-sm text-gray-300 font-medium bg-gray-700 rounded hover:bg-gray-600"
                    onClick={() => {
                      onJoin();
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
