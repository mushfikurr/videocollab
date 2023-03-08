import { createContext, useState, useRef } from "react";
import io from "socket.io-client";
import { API_URL } from "./Constants";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socket = useRef(null);
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [isConnectedToRoom, setIsConnectedToRoom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [members, setMembers] = useState([]);

  const connect = () => {
    const WS_API_URL =
      !process.env.NODE_ENV || process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : "https://redacted-api-cw.herokuapp.com";
    socket.current = io(`${WS_API_URL}/`, {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttemps: 10,
      transports: ["websocket"],
      agent: false,
      upgrade: false,
      rejectUnauthorized: false,
    });
  };

  return (
    <SocketContext.Provider
      value={{
        isOnline,
        connect,
        setIsOnline,
        roomCode,
        setRoomCode,
        username,
        setUsername,
        socket,
        isConnectedToRoom,
        setIsConnectedToRoom,
        isProcessing,
        setIsProcessing,
        members,
        setMembers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
