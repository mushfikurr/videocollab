import { useEffect, useContext, useRef, useState } from "react";
import { SocketContext } from "../utils/SocketProvider";
import { TrackHeading } from "./TrackHeading";
import { Icon } from "../components/IconButton";
import { useNavigate } from "react-router";
import { BsFillTrashFill } from "react-icons/bs";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import composeRefs from "@seznam/compose-react-refs";
import { useDebounce } from "../utils/Hooks";

function DropElement(props) {
  return <>{props.children}</>;
}

function Track(props) {
  const { socket, roomCode, username } = useContext(SocketContext);
  const [swap, setSwap] = useState();
  const onDragEnd = (result) => {
    const newItems = [...props.timelineClips[props.timelineKey]];
    const [removed] = newItems.splice(result.source.index, 1);
    console.log("removed", removed);
    newItems.splice(result.destination.index, 0, removed);

    const action = {
      roomCode: roomCode,
      username: username,
      type: "reorderTimelineClips",
      data: { key: props.timelineKey, clips: newItems },
    };

    // Optimisticly update state to prevent flashes / lag between client-server
    let optimisticUpdate = {};
    optimisticUpdate[props.timelineKey] = newItems;
    props.setTimelineClips({
      ...props.timelineClips,
      ...optimisticUpdate,
    });
    socket.current.emit("action", action);
  };

  return (
    <DragDropContext
      onDragEnd={(result) => {
        onDragEnd(result);
      }}
    >
      <Droppable droppableId={props.timelineKey} direction="horizontal">
        {(provided) => (
          <div
            className="flex h-[48px] items-center"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {props.clips.map((clip, index) => {
              return (
                <Clip
                  assetMenuWidth={props.assetMenuWidth}
                  username={clip.username}
                  dragId={clip.id}
                  hash={clip.hash}
                  index={index}
                  timelineClips={props.timelineClips}
                  timelineKey={props.timelineKey}
                  clips={props.clips}
                  clip={clip.file}
                  resized={clip.resized}
                  swap={swap}
                  setSwap={setSwap}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function DragComponent(props) {
  return <>{props.children}</>;
}

function Clip(props) {
  const [clipWidth, setClipWidth] = useState(0);
  const [isHovering, setHovering] = useState(false);
  const { socket, username, roomCode } = useContext(SocketContext);
  const clipRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [totalDuration, setTotalDuration] = useState();
  const [width, setWidth] = useState();
  const [isHoveringIcon, setIsHoveringIcon] = useState(false);
  const debouncedCurrentWidth = useDebounce(width, 500);

  useEffect(() => {
    document.addEventListener("mouseup", () => {
      setIsResizing(false);
    });
  }, []);

  useEffect(() => {
    if (isResizing) {
      var ro = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const cr = entry.contentRect;
          // console.log(`Element size: ${cr.width}px x ${cr.height}px`);
          if (cr.width) {
            setWidth(cr.width);
          }
        }
      });
      ro.observe(clipRef.current);
    }
  }, [isResizing]);

  useEffect(() => {
    if (debouncedCurrentWidth) {
      const startTime = "00:00:00";
      console.log("newWidth", debouncedCurrentWidth);
      const length =
        (totalDuration * debouncedCurrentWidth) / props.assetMenuWidth;
      const endTime = new Date(length * 1000).toISOString().substring(11, 23);
      console.log("endTime:", endTime);

      const action = {
        roomCode: roomCode,
        username: username,
        type: "resizeClip",
        data: {
          hash: props.hash,
          timelineKey: props.timelineKey,
          startTime,
          endTime,
          newWidth: debouncedCurrentWidth,
        },
      };
      socket.current.emit("action", action);
      setWidth();
    }
  }, [debouncedCurrentWidth]);

  useEffect(() => {
    console.log("resize", isResizing);
  }, [isResizing]);

  // https://stackoverflow.com/questions/26580509/calculate-time-difference-between-two-date-in-hhmmss-javascript
  function hmsToSeconds(s) {
    var b = s.split(":");
    return b[0] * 3600 + b[1] * 60 + (+b[2] || 0);
  }

  useEffect(() => {
    let totalDurationCalc = 0;
    props.timelineClips["video"].map((clip) => {
      if ("resized" in clip) {
        totalDurationCalc += hmsToSeconds(clip.resized.endTime);
      } else {
        totalDurationCalc += clip.file.videoDuration;
      }
    });
    setTotalDuration(totalDurationCalc);
    if (props.resized) {
      const aux = hmsToSeconds(props.resized.endTime);
      const width_aux = ((aux / totalDurationCalc) * 100).toFixed(2);
      setClipWidth(width_aux);
    } else {
      setClipWidth(
        ((props.clip.videoDuration / totalDurationCalc) * 100).toFixed(2)
      );
    }
  }, [props.clips]);

  const toggleHover = () => {
    setHovering(!isHovering);
  };

  const onClipRemove = (fileName) => {
    const action = {
      roomCode: roomCode,
      username: username,
      type: "removeVideoFromTimeline",
      data: { index: props.index, clip: props.clip },
    };
    socket.current.emit("action", action);
  };

  return (
    <Draggable
      key={props.dragId.toString()}
      draggableId={props.dragId.toString()}
      index={props.index}
    >
      {(provided, snapshot) => {
        const style = {
          width: `${clipWidth}%`,
          minWidth: { clipWidth },
          ...provided.draggableProps.style,
        };

        return (
          <div
            className={`resize-x overflow-auto h-[42px] shadow-md text-xs rounded-xl mr-[0.15rem] bg-gray-800 px-4 p-2`}
            ref={composeRefs(provided.innerRef, clipRef)}
            {...provided.draggableProps}
            style={style}
            onMouseDown={() => {
              if (!isHoveringIcon && !isHovering) setIsResizing(true);
            }}
          >
            <div
              className="flex justify-content items-center h-full"
              onMouseEnter={toggleHover}
              onMouseLeave={toggleHover}
              {...provided.dragHandleProps}
            >
              <span className="grow">
                <p
                  className={`${
                    isHovering ? "text-xs" : "text-sm"
                  } font-medium`}
                >
                  {props.clip.fileName}
                </p>
                {isHovering && <p className="text-xs">{props.username}</p>}
              </span>

              <Icon
                onClick={() => {
                  onClipRemove(props.clip.fileName);
                }}
                onMouseEnter={() => {
                  setIsHoveringIcon(true);
                }}
                onMouseLeave={() => {
                  setIsHoveringIcon(false);
                }}
              >
                <BsFillTrashFill className="w-4 h-4" />
              </Icon>
            </div>
          </div>
        );
      }}
    </Draggable>
  );
}

export function VideoTimeline(props) {
  const assetMenuRef = useRef(null);

  const [assetMenuWidth, setAssetMenuWidth] = useState();
  const [assetMenuHeight, setAssetMenuHeight] = useState();
  const [cursorX, setCursorX] = useState(20);
  const navigate = useNavigate();

  const updateTime = () => {
    if (props.videoRef.current?.getCurrentTime() !== 0) {
      const newTime =
        props.videoRef.current?.getCurrentTime() *
        (100 / props.videoRef.current?.getDuration());
      const range = (assetMenuWidth - 40) / 100;
      setCursorX(20 + newTime * range);
    }
  };

  useEffect(() => {
    updateTime();
  }, [props.currentTime]);

  useEffect(() => {
    setAssetMenuHeight(assetMenuRef.current.offsetHeight);
    setAssetMenuWidth(assetMenuRef.current.offsetWidth);

    window.addEventListener(
      "resize",
      () => {
        if (assetMenuRef.current !== null) {
          setAssetMenuHeight(assetMenuRef.current.offsetHeight);
          setAssetMenuWidth(assetMenuRef.current.offsetWidth);
        }
      },
      true
    );
  }, []);

  return (
    <>
      <div className="w-2/6 border-gray-800 border-r h-full">
        <p className="px-4 py-3 h-1/6 font-medium border-gray-800">Tracks</p>
        <div className="px-4">
          {Object.keys(props.timelineClips).map((key) => {
            return <TrackHeading name={key} />;
          })}
        </div>
      </div>
      <div className="w-4/6" ref={assetMenuRef}>
        <svg
          className="absolute"
          width={assetMenuWidth}
          height={assetMenuHeight}
        >
          <rect x={cursorX} fill="#0284c7" width="1" height={assetMenuHeight} />
        </svg>
        <div className="pt-[2.7rem] px-2 mr-[0.6rem] ml-3 relative">
          {Object.keys(props.timelineClips).map((key, index) => {
            return (
              <Track
                index={index}
                assetMenuWidth={assetMenuWidth}
                clips={props.timelineClips[key]}
                timelineClips={props.timelineClips}
                timelineKey={key}
                setTimelineClips={props.setTimelineClips}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
