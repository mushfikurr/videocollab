import Titlebar from "./Titlebar";

export default function PageContainer(props) {
  return (
    <>
      <Titlebar />
      {props.children}
    </>
  );
}
