import Titlebar from "../components/Titlebar";
import { useEffect, useState, useContext, useRef } from "react";
import NavigationMenu from "../components/NavigationMenu";
import { SocketContext } from "../utils/SocketProvider";
import { RiSettings3Line, RiLogoutBoxLine } from "react-icons/ri";
import { VideoTimeline } from "../components/VideoTimeline";
import { MemberList } from "../components/MemberList";
import { Export } from "./Export";
import { API_URL } from "../utils/Constants";
import { FilesDisplay } from "../components/FilesDisplay";
import ReactPlayer from "react-player";
import { useNavigate } from "react-router";
import React from "react";

const menuItems = [
  { icon: <RiLogoutBoxLine className="h-5 w-5" />, path: "" },
  { icon: <RiSettings3Line className="h-5 w-5" />, path: "" },
];

export default function Timeline() {
  const {
    setIsConnectedToRoom,
    setIsProcessing,
    isProcessing,
    isConnectedToRoom,
    isOnline,
    socket,
    connect,
    setIsOnline,
    roomCode,
    username,
  } = useContext(SocketContext);
  const sock = socket.current;
  const [timelineClips, setTimelineClips] = useState({ video: [], audio: [] });
  const videoRef = useRef(null);
  const [renderReady, setRenderReady] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [progressSecs, setProgressSecs] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    connect();
    socket.current.on("connect", () => {
      setIsOnline(true);
    });

    socket.current.on("failure", () => {
      console.log("Failure to connect. Returning to home screen.");
      navigate("/");
    });

    return () => {
      setIsOnline(false);
      setIsConnectedToRoom(false);
      socket.current.off();
      socket.current.close();
    };
  }, []);

  const naviagteToExport = () => {
    setShowExport(true);
  };

  useEffect(() => {
    if (isOnline) {
      sock.emit("join", roomCode, username, (data) => {
        if (data) {
          console.log("Acknowledged join room");
          setIsConnectedToRoom(true);
        }
      });
      console.log("Socket online");
    }
  }, [isOnline]);

  const [currentTime, setCurrentTime] = useState();
  const [play, setPlay] = useState();

  useEffect(() => {
    if (!isConnectedToRoom) return;
    const action = {
      type: "seek",
      roomCode: roomCode,
      username: username,
      timestamp: currentTime,
    };
    sock.emit("actionClient", action);
  }, [currentTime]);

  const seekListener = () => {
    setCurrentTime(videoRef.current?.getCurrentTime());
  };

  const playListener = () => {
    const action = {
      type: "play",
      roomCode: roomCode,
      username: username,
      playing: true,
    };
    sock.emit("actionClient", action);
  };

  const pauseListener = () => {
    const action = {
      type: "pause",
      roomCode: roomCode,
      username: username,
      playing: false,
    };
    sock.emit("actionClient", action);
  };

  useEffect(() => {
    if (renderReady) {
      setVideoUrl(
        `${API_URL}/uploads/${roomCode}/preview/currentRender.mp4#${Math.random()}`
      );
    }
  }, [renderReady]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.getInternalPlayer()) {
      videoRef.current.getInternalPlayer().src = videoUrl;
    }
  }, [videoUrl]);

  const actionResponseListener = (action) => {
    if (action.type === "addVideoToTimeline") {
      setTimelineClips({
        ...timelineClips,
        ...action.files,
      });
    }
  };

  const actionResponseClientListener = (action) => {
    const actionClientResponses = {
      play: () => {
        setPlay(true);
      },
      seek: () => {
        videoRef.current?.seekTo(action.timestamp, "seconds");
      },
      pause: () => {
        setPlay(false);
      },
    };
    actionClientResponses[action.type]();
  };

  const processingListener = (data) => {
    if (data === "true") {
      setRenderReady(false);
      setIsProcessing(true);
    } else {
      setIsProcessing(false);
    }
  };

  const renderCompleteListener = () => {
    setRenderReady(true);
    console.log("Render ready true!");
  };

  useEffect(() => {
    if (isConnectedToRoom) {
      socket.current.on("actionResponse", actionResponseListener);
      socket.current.on("actionResponseClient", actionResponseClientListener);
      socket.current.on("processing", processingListener);
      socket.current.on("renderComplete", renderCompleteListener);
    } else {
      socket.current.off("actionResponse", actionResponseListener);
      socket.current.off("actionResponseClient", actionResponseClientListener);
      socket.current.off("processing", processingListener);
      socket.current.off("renderComplete", renderCompleteListener);
    }
  }, [isConnectedToRoom]);

  return (
    <>
      {showExport ? (
        <Export setShowExport={setShowExport} />
      ) : (
        <>
          <Titlebar />
          <div className="flex flex-nowrap text-gray-400 bg-gray-900 border-gray-800">
            <NavigationMenu menuItems={menuItems}></NavigationMenu>
            <div className="flex flex-1 w-6/6 flex-wrap h-[calc(100vh-2rem)]">
              <FilesDisplay
                timelineClips={timelineClips}
                setTimelineClips={setTimelineClips}
              />
              {/* Right Area */}
              <div className="w-4/6 h-4/6">
                <div className="flex h-16 w-full items-center justify-between border-b border-gray-800 px-4">
                  <span className="font-medium grow">
                    {isProcessing ? "Processing..." : ""}
                  </span>
                  <MemberList isConnectedToRoom={isConnectedToRoom} />
                  <button
                    onClick={naviagteToExport}
                    className="flex items-center justify-center px-4 ml-2 flex-shrink-0 h-10 bg-sky-700 hover:bg-sky-600 text-sm text-gray-300 font-medium rounded"
                  >
                    Export
                  </button>
                </div>
                {renderReady && (
                  <React.Fragment key={videoUrl}>
                    <ReactPlayer
                      key={videoUrl}
                      ref={videoRef}
                      url={videoUrl}
                      onPlay={() => {
                        playListener();
                      }}
                      onPause={() => {
                        pauseListener();
                      }}
                      onSeek={() => {
                        seekListener();
                      }}
                      onProgress={(obj) => {
                        setProgressSecs(obj.playedSeconds);
                      }}
                      playing={play}
                      width="100%"
                      height="75%"
                      controls={true}
                    />
                  </React.Fragment>
                )}
              </div>
              <div className="flex w-full border-gray-800 border-t h-2/6 overflow-auto">
                <VideoTimeline
                  videoRef={videoRef}
                  currentTime={progressSecs}
                  timelineClips={timelineClips}
                  setTimelineClips={setTimelineClips}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
