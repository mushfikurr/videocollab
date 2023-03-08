import { useEffect, useRef, useContext, useState } from "react";
import { RiUser3Line, RiChat4Line, RiSendPlane2Line } from "react-icons/ri";
import { SocketContext } from "../utils/SocketProvider";
import { Icon } from "./IconButton";

import { Popover, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";

function MemberIcon() {
  return (
    <div className="mr-2 shadow-inner cursor-pointer text-gray-400 hover:text-sky-500 rounded-full hover:bg-gray-700 bg-gray-800 p-1">
      <RiUser3Line className="h-6 w-6 rounded-full" />
    </div>
  );
}

export function MemberList(props) {
  const { socket, roomCode, username, setMembers } = useContext(SocketContext);
  const [memberList, setMemberList] = useState([]);
  let [referenceElement, setReferenceElement] = useState();
  let [popperElement, setPopperElement] = useState();
  let { styles, attributes } = usePopper(referenceElement, popperElement);
  const [inputChat, setInputChat] = useState();
  const [chatMessages, setChatMessages] = useState();
  const scrollElement = useRef(null);
  const chatWindow = useRef(null);
  const inputChatRef = useRef(null);

  useEffect(() => {
    if (props.isConnectedToRoom) {
      const action = {
        type: "getUsers",
        roomCode: roomCode,
        username: username,
      };
      socket.current.emit("actionClient", action);

      socket.current.on("users", (data) => {
        setMemberList(data);
        setMembers(data);
      });

      socket.current.on("chatResponse", (response) => {
        setChatMessages(response);
        chatWindow.current.scrollTo(0, scrollElement.current.offsetTop);
      });
    }
  }, [props.isConnectedToRoom]);

  const sendMessage = () => {
    socket.current.emit("chat", roomCode, username, inputChat);
    inputChatRef.current.value = "";
  };
  // props -> memberList
  return (
    <div className="flex justify-center items-center pr-1">
      {memberList?.slice(0, 5).map((member) => {
        return <MemberIcon />;
      })}
      <div
        ref={setReferenceElement}
        className="flex justify-center items-center h-full"
      >
        <Popover>
          <Popover.Button>
            <Icon>
              <RiChat4Line className="cursor-pointer p-[0.1rem] w-6 h-6" />
            </Icon>
          </Popover.Button>

          <Popover.Panel
            ref={setPopperElement}
            style={styles.popper}
            className="absolute z-10"
            {...attributes.popper}
          >
            <div className="z-10 flex flex-col mt-2 bg-gray-800 w-52 rounded">
              <div
                ref={chatWindow}
                className="grow h-72 w-full p-3 overflow-auto"
              >
                {chatMessages?.map((message) => {
                  return (
                    <div
                      key={message.message}
                      ref={scrollElement}
                      className="bg-gray-700 mb-2 py-3 px-3 rounded"
                    >
                      <p className="text-sm font-medium">{message.username}</p>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 flex justify-content items-center h-16">
                <input
                  ref={inputChatRef}
                  placeholder="Chat..."
                  className="w-full h-full px-3 rounded hover:bg-gray-600 border-none focus:outline-none text-gray-300 text-sm focus:ring-0 bg-gray-700"
                  onChange={(e) => {
                    setInputChat(e.target.value);
                  }}
                ></input>
                <button
                  onClick={sendMessage}
                  className="flex items-center justify-center px-3 ml-2 flex-shrink-0 h-full bg-sky-700 hover:bg-sky-600 text-sm text-gray-300 font-medium rounded"
                >
                  <RiSendPlane2Line />
                </button>
              </div>
            </div>
          </Popover.Panel>
        </Popover>
      </div>
    </div>
  );
}
