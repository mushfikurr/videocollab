export function Icon(props) {
  return (
    <div
      className={`cursor-pointer flex items-center justify-center hover:text-sky-500 p-1 rounded-full hover:bg-gray-700 ${props.styles}`}
      onClick={props.onClick}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      {props.children}
    </div>
  );
}
